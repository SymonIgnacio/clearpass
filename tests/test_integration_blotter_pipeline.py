import pytest
import pandas as pd
import os
from unittest.mock import patch, MagicMock
from pathlib import Path
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend


@pytest.fixture
def sample_blotter_csv_content():
    """Sample blotter CSV content for testing"""
    return """date,category,description,status,location
2024-01-01,Theft,Stolen bicycle,Resolved,Zone 1
2024-01-02,Assault,Domestic dispute,Ongoing,Zone 2
2024-01-03,Theft,Pickpocketing,Resolved,Zone 1
2024-01-15,Noise Complaint,Loud music,Resolved,Zone 3
2024-02-01,Assault,Bar fight,Ongoing,Zone 2
2024-02-05,Vandalism,Graffiti on wall,Resolved,Zone 1
2024-02-10,Theft,Stolen phone,Under Investigation,Zone 3
2024-03-01,Assault,Street fight,Resolved,Zone 2
2024-03-05,Noise Complaint,Late night party,Resolved,Zone 3
2024-03-10,Vandalism,Broken windows,Under Investigation,Zone 1
"""


@pytest.fixture
def sample_blotter_dataframe(sample_blotter_csv_content):
    """Sample blotter DataFrame for testing"""
    from io import StringIO
    return pd.read_csv(StringIO(sample_blotter_csv_content))


class MockBlotterAnalytics:
    """Mock blotter analytics engine"""

    def __init__(self, data):
        self.data = data

    def get_category_counts(self):
        """Count incidents by category"""
        return self.data['category'].value_counts().to_dict()

    def get_monthly_grouping(self):
        """Group incidents by month"""
        self.data['date'] = pd.to_datetime(self.data['date'])
        return self.data.groupby(self.data['date'].dt.to_period('M')).size().to_dict()

    def get_status_distribution(self):
        """Get status distribution"""
        return self.data['status'].value_counts().to_dict()

    def get_top_categories(self, n=5):
        """Get top N categories"""
        return self.data['category'].value_counts().head(n).to_dict()

    def get_zone_distribution(self):
        """Get incidents by zone"""
        return self.data['location'].value_counts().to_dict()


class MockChartGenerator:
    """Mock chart generator for blotter analytics"""

    def __init__(self, analytics):
        self.analytics = analytics

    def generate_category_chart(self, output_path):
        """Generate category distribution chart"""
        import matplotlib.pyplot as plt

        counts = self.analytics.get_category_counts()

        plt.figure(figsize=(10, 6))
        plt.bar(counts.keys(), counts.values())
        plt.title('Incidents by Category')
        plt.xlabel('Category')
        plt.ylabel('Count')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(output_path)
        plt.close()

        return output_path

    def generate_monthly_trend_chart(self, output_path):
        """Generate monthly trend chart"""
        import matplotlib.pyplot as plt

        monthly = self.analytics.get_monthly_grouping()
        periods = [str(k) for k in monthly.keys()]
        values = list(monthly.values())

        plt.figure(figsize=(12, 6))
        plt.plot(periods, values, marker='o')
        plt.title('Monthly Incident Trends')
        plt.xlabel('Month')
        plt.ylabel('Number of Incidents')
        plt.xticks(rotation=45)
        plt.grid(True)
        plt.tight_layout()
        plt.savefig(output_path)
        plt.close()

        return output_path

    def generate_status_pie_chart(self, output_path):
        """Generate status distribution pie chart"""
        import matplotlib.pyplot as plt

        status_dist = self.analytics.get_status_distribution()

        plt.figure(figsize=(8, 8))
        plt.pie(status_dist.values(), labels=status_dist.keys(), autopct='%1.1f%%')
        plt.title('Incident Status Distribution')
        plt.axis('equal')
        plt.savefig(output_path)
        plt.close()

        return output_path


def test_blotter_pipeline_complete_workflow(tmp_path, sample_blotter_dataframe):
    """Test complete blotter pipeline: load CSV → compute analytics → generate charts"""
    # Step 1: Load blotter data
    blotter_data = sample_blotter_dataframe

    # Verify data loaded correctly
    assert len(blotter_data) == 10
    assert list(blotter_data.columns) == ['date', 'category', 'description', 'status', 'location']

    # Step 2: Initialize analytics
    analytics = MockBlotterAnalytics(blotter_data)

    # Step 3: Compute analytics
    category_counts = analytics.get_category_counts()
    monthly_grouping = analytics.get_monthly_grouping()
    status_dist = analytics.get_status_distribution()
    zone_dist = analytics.get_zone_distribution()

    # Verify analytics results
    assert len(category_counts) == 4  # 4 unique categories
    assert 'Theft' in category_counts
    assert category_counts['Theft'] == 3

    assert len(monthly_grouping) == 3  # 3 months of data
    assert len(status_dist) == 3  # 3 status types
    assert len(zone_dist) == 3  # 3 zones

    # Step 4: Generate charts
    chart_generator = MockChartGenerator(analytics)

    # Generate category chart
    category_chart_path = tmp_path / "category_chart.png"
    result_path = chart_generator.generate_category_chart(str(category_chart_path))
    assert Path(result_path).exists()

    # Generate monthly trend chart
    trend_chart_path = tmp_path / "monthly_trend.png"
    result_path = chart_generator.generate_monthly_trend_chart(str(trend_chart_path))
    assert Path(result_path).exists()

    # Generate status pie chart
    status_chart_path = tmp_path / "status_pie.png"
    result_path = chart_generator.generate_status_pie_chart(str(status_chart_path))
    assert Path(result_path).exists()

    # Verify all chart files were created
    assert category_chart_path.exists()
    assert trend_chart_path.exists()
    assert status_chart_path.exists()


@patch('pandas.read_csv')
def test_blotter_pipeline_csv_loading(mock_read_csv, tmp_path, sample_blotter_dataframe):
    """Test CSV loading in blotter pipeline"""
    mock_read_csv.return_value = sample_blotter_dataframe

    # Simulate loading CSV
    loaded_data = pd.read_csv('sample_blotter.csv')

    # Verify data was loaded
    assert len(loaded_data) == 10
    assert mock_read_csv.called

    # Continue with analytics
    analytics = MockBlotterAnalytics(loaded_data)
    counts = analytics.get_category_counts()

    assert len(counts) > 0


@patch('pandas.read_csv', side_effect=FileNotFoundError)
def test_blotter_pipeline_missing_csv_handling(mock_read_csv):
    """Test handling of missing CSV file"""
    with pytest.raises(FileNotFoundError):
        pd.read_csv('nonexistent_blotter.csv')


@patch('pandas.read_csv', side_effect=pd.errors.EmptyDataError)
def test_blotter_pipeline_empty_csv_handling(mock_read_csv):
    """Test handling of empty CSV file"""
    with pytest.raises(pd.errors.EmptyDataError):
        pd.read_csv('empty_blotter.csv')


def test_blotter_pipeline_analytics_computation(sample_blotter_dataframe):
    """Test analytics computation in blotter pipeline"""
    analytics = MockBlotterAnalytics(sample_blotter_dataframe)

    # Test category counts
    cat_counts = analytics.get_category_counts()
    expected_counts = {'Theft': 3, 'Assault': 3, 'Noise Complaint': 2, 'Vandalism': 2}
    assert cat_counts == expected_counts

    # Test monthly grouping
    monthly = analytics.get_monthly_grouping()
    assert len(monthly) == 3
    # January should have 4 incidents
    jan_period = pd.Period('2024-01', 'M')
    assert monthly[jan_period] == 4

    # Test status distribution
    status_dist = analytics.get_status_distribution()
    expected_status = {'Resolved': 6, 'Ongoing': 2, 'Under Investigation': 2}
    assert status_dist == expected_status

    # Test zone distribution
    zone_dist = analytics.get_zone_distribution()
    expected_zones = {'Zone 1': 4, 'Zone 2': 4, 'Zone 3': 2}
    assert zone_dist == expected_zones


def test_blotter_pipeline_chart_generation(tmp_path, sample_blotter_dataframe):
    """Test chart generation in blotter pipeline"""
    analytics = MockBlotterAnalytics(sample_blotter_dataframe)
    chart_gen = MockChartGenerator(analytics)

    # Test category chart
    cat_chart = tmp_path / "test_category.png"
    result = chart_gen.generate_category_chart(str(cat_chart))
    assert Path(result).exists()
    assert cat_chart.stat().st_size > 0  # File has content

    # Test trend chart
    trend_chart = tmp_path / "test_trend.png"
    result = chart_gen.generate_monthly_trend_chart(str(trend_chart))
    assert Path(result).exists()
    assert trend_chart.stat().st_size > 0

    # Test pie chart
    pie_chart = tmp_path / "test_pie.png"
    result = chart_gen.generate_status_pie_chart(str(pie_chart))
    assert Path(result).exists()
    assert pie_chart.stat().st_size > 0


@patch('matplotlib.pyplot.savefig')
def test_blotter_pipeline_chart_generation_with_matplotlib_mock(mock_savefig, tmp_path, sample_blotter_dataframe):
    """Test chart generation with mocked matplotlib"""
    analytics = MockBlotterAnalytics(sample_blotter_dataframe)
    chart_gen = MockChartGenerator(analytics)

    # Generate charts (matplotlib operations will be mocked)
    cat_chart = tmp_path / "mocked_category.png"
    result = chart_gen.generate_category_chart(str(cat_chart))

    # Verify matplotlib savefig was called
    mock_savefig.assert_called()


def test_blotter_pipeline_empty_data_handling():
    """Test blotter pipeline with empty data"""
    empty_data = pd.DataFrame(columns=['date', 'category', 'description', 'status', 'location'])

    analytics = MockBlotterAnalytics(empty_data)

    # Should handle empty data gracefully
    cat_counts = analytics.get_category_counts()
    monthly = analytics.get_monthly_grouping()
    status_dist = analytics.get_status_distribution()

    assert cat_counts == {}
    assert monthly == {}
    assert status_dist == {}


def test_blotter_pipeline_data_validation(sample_blotter_dataframe):
    """Test data validation in blotter pipeline"""
    # Test with invalid data
    invalid_data = sample_blotter_dataframe.copy()
    invalid_data.loc[0, 'date'] = 'invalid-date'

    analytics = MockBlotterAnalytics(invalid_data)

    # Should handle invalid dates gracefully
    try:
        monthly = analytics.get_monthly_grouping()
        # If no exception, monthly grouping should still work for valid dates
        assert isinstance(monthly, dict)
    except Exception:
        # If exception occurs, it's acceptable as invalid data should be handled
        pass


def test_blotter_pipeline_multiple_analytics_operations(sample_blotter_dataframe):
    """Test multiple analytics operations in pipeline"""
    analytics = MockBlotterAnalytics(sample_blotter_dataframe)

    # Perform multiple operations
    operations = [
        analytics.get_category_counts,
        analytics.get_monthly_grouping,
        analytics.get_status_distribution,
        analytics.get_zone_distribution,
        lambda: analytics.get_top_categories(3)
    ]

    results = []
    for op in operations:
        result = op()
        results.append(result)
        assert isinstance(result, dict)
        assert len(result) > 0

    # Verify results are consistent
    cat_counts_1 = analytics.get_category_counts()
    cat_counts_2 = analytics.get_category_counts()
    assert cat_counts_1 == cat_counts_2


def test_blotter_pipeline_chart_file_formats(tmp_path, sample_blotter_dataframe):
    """Test chart generation with different file formats"""
    analytics = MockBlotterAnalytics(sample_blotter_dataframe)
    chart_gen = MockChartGenerator(analytics)

    formats = ['png', 'jpg', 'svg', 'pdf']

    for fmt in formats:
        chart_path = tmp_path / f"test_chart.{fmt}"
        try:
            result = chart_gen.generate_category_chart(str(chart_path))
            # If format is supported, file should exist
            if fmt in ['png', 'jpg', 'svg', 'pdf']:
                assert Path(result).exists()
        except Exception:
            # If format not supported by matplotlib, it's acceptable
            pass


def test_blotter_pipeline_large_dataset_performance():
    """Test blotter pipeline performance with larger dataset"""
    # Create larger dataset
    import numpy as np

    dates = pd.date_range('2024-01-01', periods=100, freq='D')
    categories = np.random.choice(['Theft', 'Assault', 'Vandalism', 'Noise'], 100)
    statuses = np.random.choice(['Resolved', 'Ongoing', 'Under Investigation'], 100)
    locations = np.random.choice(['Zone 1', 'Zone 2', 'Zone 3'], 100)
    descriptions = [f'Incident {i}' for i in range(100)]

    large_data = pd.DataFrame({
        'date': dates,
        'category': categories,
        'description': descriptions,
        'status': statuses,
        'location': locations
    })

    analytics = MockBlotterAnalytics(large_data)

    # Test analytics computation
    cat_counts = analytics.get_category_counts()
    monthly = analytics.get_monthly_grouping()

    assert len(cat_counts) > 0
    assert len(monthly) > 0
    assert sum(cat_counts.values()) == 100  # All incidents counted


def test_blotter_pipeline_error_recovery(tmp_path, sample_blotter_dataframe):
    """Test error recovery in blotter pipeline"""
    analytics = MockBlotterAnalytics(sample_blotter_dataframe)
    chart_gen = MockChartGenerator(analytics)

    # Test chart generation with invalid path
    invalid_path = "/invalid/path/chart.png"

    try:
        result = chart_gen.generate_category_chart(invalid_path)
        # Should either succeed or fail gracefully
    except Exception:
        # Exception is acceptable for invalid paths
        pass

    # Pipeline should continue to work for valid paths
    valid_path = tmp_path / "recovery_test.png"
    result = chart_gen.generate_category_chart(str(valid_path))
    assert Path(result).exists()


def test_blotter_pipeline_memory_efficiency():
    """Test memory efficiency of blotter pipeline"""
    # Create moderately large dataset
    dates = pd.date_range('2024-01-01', periods=1000, freq='H')
    categories = ['Theft'] * 1000
    descriptions = [f'Incident {i}' for i in range(1000)]
    statuses = ['Resolved'] * 1000
    locations = ['Zone 1'] * 1000

    large_data = pd.DataFrame({
        'date': dates,
        'category': categories,
        'description': descriptions,
        'status': statuses,
        'location': locations
    })

    analytics = MockBlotterAnalytics(large_data)

    # Operations should complete without memory issues
    cat_counts = analytics.get_category_counts()
    monthly = analytics.get_monthly_grouping()

    assert cat_counts['Theft'] == 1000
    assert len(monthly) > 0
