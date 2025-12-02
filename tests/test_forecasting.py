import pytest
import pandas as pd
from unittest.mock import patch, MagicMock
import numpy as np


@pytest.fixture
def sample_time_series_data():
    """Sample time series data for forecasting tests"""
    dates = pd.date_range('2024-01-01', periods=12, freq='M')
    values = [10, 12, 15, 11, 14, 16, 18, 17, 19, 21, 20, 22]
    return pd.DataFrame({
        'date': dates,
        'incidents': values
    })


class MockForecaster:
    """Mock forecasting engine"""

    def __init__(self, data):
        self.data = data

    def simple_moving_average(self, window=3):
        """Calculate simple moving average forecast"""
        values = self.data['incidents'].values
        if len(values) < window:
            return []

        forecast = []
        for i in range(window, len(values) + 1):
            avg = np.mean(values[i-window:i])
            forecast.append(avg)

        return forecast

    def linear_trend_forecast(self, periods=3):
        """Simple linear trend forecast"""
        values = self.data['incidents'].values
        x = np.arange(len(values))
        slope, intercept = np.polyfit(x, values, 1)

        forecast = []
        for i in range(1, periods + 1):
            predicted = slope * (len(values) + i) + intercept
            forecast.append(max(0, predicted))  # Ensure non-negative

        return forecast

    def exponential_smoothing(self, alpha=0.3):
        """Simple exponential smoothing"""
        values = self.data['incidents'].values
        if len(values) == 0:
            return []

        smoothed = [values[0]]  # First value as initial

        for i in range(1, len(values)):
            smoothed_val = alpha * values[i] + (1 - alpha) * smoothed[-1]
            smoothed.append(smoothed_val)

        return smoothed


def test_simple_moving_average_basic(sample_time_series_data):
    """Test basic SMA calculation"""
    forecaster = MockForecaster(sample_time_series_data)

    sma = forecaster.simple_moving_average(window=3)

    # Should have 10 values (12 total - 3 + 1)
    assert len(sma) == 10
    # First SMA should be average of first 3 values: (10+12+15)/3 = 12.333...
    assert abs(sma[0] - 12.333333) < 0.01
    # Last SMA should be average of last 3 values: (20+21+22)/3 = 21
    assert abs(sma[-1] - 21.0) < 0.01


def test_simple_moving_average_small_window(sample_time_series_data):
    """Test SMA with window size 2"""
    forecaster = MockForecaster(sample_time_series_data)

    sma = forecaster.simple_moving_average(window=2)

    assert len(sma) == 11  # 12 total - 2 + 1
    # First SMA: (10+12)/2 = 11
    assert sma[0] == 11.0


def test_simple_moving_average_insufficient_data():
    """Test SMA with insufficient data"""
    small_data = pd.DataFrame({
        'date': pd.date_range('2024-01-01', periods=2, freq='M'),
        'incidents': [10, 12]
    })

    forecaster = MockForecaster(small_data)
    sma = forecaster.simple_moving_average(window=3)

    assert sma == []


def test_linear_trend_forecast(sample_time_series_data):
    """Test linear trend forecasting"""
    forecaster = MockForecaster(sample_time_series_data)

    forecast = forecaster.linear_trend_forecast(periods=3)

    assert len(forecast) == 3
    # All forecast values should be non-negative
    assert all(f >= 0 for f in forecast)
    # Forecast should generally trend upward based on data
    assert forecast[-1] > forecast[0]


def test_linear_trend_forecast_single_period(sample_time_series_data):
    """Test linear trend forecast for single period"""
    forecaster = MockForecaster(sample_time_series_data)

    forecast = forecaster.linear_trend_forecast(periods=1)

    assert len(forecast) == 1
    assert forecast[0] >= 0


def test_exponential_smoothing_basic(sample_time_series_data):
    """Test basic exponential smoothing"""
    forecaster = MockForecaster(sample_time_series_data)

    smoothed = forecaster.exponential_smoothing(alpha=0.3)

    assert len(smoothed) == 12  # Same length as input
    # First value should be same as original
    assert smoothed[0] == sample_time_series_data['incidents'].iloc[0]
    # Values should be smoothed (less volatile than original)
    original_diff = abs(sample_time_series_data['incidents'].iloc[1] - sample_time_series_data['incidents'].iloc[0])
    smoothed_diff = abs(smoothed[1] - smoothed[0])
    assert smoothed_diff <= original_diff


def test_exponential_smoothing_alpha_variations(sample_time_series_data):
    """Test exponential smoothing with different alpha values"""
    forecaster = MockForecaster(sample_time_series_data)

    # High alpha (more responsive to recent changes)
    smoothed_high = forecaster.exponential_smoothing(alpha=0.8)
    # Low alpha (more weight on historical values)
    smoothed_low = forecaster.exponential_smoothing(alpha=0.2)

    assert len(smoothed_high) == len(smoothed_low) == 12

    # High alpha should be more responsive (closer to original recent values)
    recent_original = sample_time_series_data['incidents'].iloc[-1]
    assert abs(smoothed_high[-1] - recent_original) < abs(smoothed_low[-1] - recent_original)


def test_exponential_smoothing_empty_data():
    """Test exponential smoothing with empty data"""
    empty_data = pd.DataFrame(columns=['date', 'incidents'])
    forecaster = MockForecaster(empty_data)

    smoothed = forecaster.exponential_smoothing()

    assert smoothed == []


def test_forecaster_initialization(sample_time_series_data):
    """Test forecaster initializes correctly"""
    forecaster = MockForecaster(sample_time_series_data)

    assert len(forecaster.data) == 12
    assert 'date' in forecaster.data.columns
    assert 'incidents' in forecaster.data.columns


@patch('numpy.polyfit')
def test_linear_trend_with_numpy_mock(mock_polyfit, sample_time_series_data):
    """Test linear trend forecast with mocked numpy"""
    mock_polyfit.return_value = [2.0, 5.0]  # slope=2, intercept=5

    forecaster = MockForecaster(sample_time_series_data)
    forecast = forecaster.linear_trend_forecast(periods=2)

    # Should call polyfit with correct parameters
    mock_polyfit.assert_called_once()
    args, kwargs = mock_polyfit.call_args
    assert len(args[0]) == 12  # x values
    assert len(args[1]) == 12  # y values

    # Forecast values: slope * (len + i) + intercept
    # For i=1: 2*(12+1) + 5 = 31
    # For i=2: 2*(12+2) + 5 = 33
    assert forecast == [31.0, 33.0]


@patch('numpy.mean')
def test_moving_average_with_numpy_mock(mock_mean, sample_time_series_data):
    """Test moving average with mocked numpy mean"""
    mock_mean.side_effect = [10.5, 11.0, 12.5]  # Mock return values

    forecaster = MockForecaster(sample_time_series_data)
    sma = forecaster.simple_moving_average(window=2)

    # Should call mean for each window
    assert mock_mean.call_count == 11  # 12-2+1 = 11 windows

    # Results should match mocked values
    assert sma == [10.5, 11.0, 12.5]


def test_forecasting_edge_cases():
    """Test forecasting with edge case data"""
    # Data with zeros
    zero_data = pd.DataFrame({
        'date': pd.date_range('2024-01-01', periods=5, freq='M'),
        'incidents': [0, 0, 0, 0, 0]
    })

    forecaster = MockForecaster(zero_data)

    sma = forecaster.simple_moving_average(window=3)
    trend = forecaster.linear_trend_forecast(periods=2)
    smoothed = forecaster.exponential_smoothing()

    assert all(s == 0.0 for s in sma)
    assert all(t == 0.0 for t in trend)  # Flat line should forecast zeros
    assert all(s == 0.0 for s in smoothed)


def test_forecasting_single_data_point():
    """Test forecasting with minimal data"""
    single_data = pd.DataFrame({
        'date': pd.date_range('2024-01-01', periods=1, freq='M'),
        'incidents': [10]
    })

    forecaster = MockForecaster(single_data)

    sma = forecaster.simple_moving_average(window=3)
    trend = forecaster.linear_trend_forecast(periods=1)
    smoothed = forecaster.exponential_smoothing()

    assert sma == []  # Insufficient data
    assert len(trend) == 1  # Should still forecast
    assert smoothed == [10]  # Single value returned as-is
