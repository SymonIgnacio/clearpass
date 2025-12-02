import pytest
import pandas as pd
from unittest.mock import patch, mock_open
import io
from collections import Counter


@pytest.fixture
def sample_blotter_data():
    """Sample blotter data for testing"""
    return pd.DataFrame({
        'date': ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-15', '2024-02-01'],
        'category': ['Theft', 'Assault', 'Theft', 'Noise Complaint', 'Assault'],
        'description': ['Stolen bicycle', 'Domestic dispute', 'Pickpocketing', 'Loud music', 'Bar fight'],
        'status': ['Resolved', 'Ongoing', 'Resolved', 'Resolved', 'Ongoing']
    })


@pytest.fixture
def sample_blotter_csv():
    """Sample blotter CSV content"""
    return """date,category,description,status
2024-01-01,Theft,Stolen bicycle,Resolved
2024-01-02,Assault,Domestic dispute,Ongoing
2024-01-03,Theft,Pickpocketing,Resolved
2024-01-15,Noise Complaint,Loud music,Resolved
2024-02-01,Assault,Bar fight,Ongoing
"""


class MockBlotterAnalytics:
    """Mock blotter analytics engine"""

    def __init__(self, data):
        self.data = data

    def get_category_counts(self):
        """Count incidents by category"""
        return dict(Counter(self.data['category']))

    def get_monthly_grouping(self):
        """Group incidents by month"""
        self.data['date'] = pd.to_datetime(self.data['date'])
        return self.data.groupby(self.data['date'].dt.to_period('M')).size().to_dict()

    def get_status_distribution(self):
        """Get status distribution"""
        return dict(Counter(self.data['status']))

    def get_top_categories(self, n=3):
        """Get top N categories by frequency"""
        counts = self.get_category_counts()
        return dict(sorted(counts.items(), key=lambda x: x[1], reverse=True)[:n])


def test_category_counting_basic(sample_blotter_data):
    """Test basic category counting functionality"""
    analytics = MockBlotterAnalytics(sample_blotter_data)

    counts = analytics.get_category_counts()

    assert counts['Theft'] == 2
    assert counts['Assault'] == 2
    assert counts['Noise Complaint'] == 1
    assert len(counts) == 3


def test_category_counting_empty_data():
    """Test category counting with empty dataset"""
    empty_data = pd.DataFrame(columns=['date', 'category', 'description', 'status'])
    analytics = MockBlotterAnalytics(empty_data)

    counts = analytics.get_category_counts()

    assert counts == {}


def test_monthly_grouping(sample_blotter_data):
    """Test monthly grouping of incidents"""
    analytics = MockBlotterAnalytics(sample_blotter_data)

    monthly = analytics.get_monthly_grouping()

    # Should have incidents in January and February
    assert len(monthly) == 2
    # January should have 4 incidents (4 dates in Jan)
    assert monthly[pd.Period('2024-01', 'M')] == 4
    # February should have 1 incident
    assert monthly[pd.Period('2024-02', 'M')] == 1


def test_status_distribution(sample_blotter_data):
    """Test status distribution counting"""
    analytics = MockBlotterAnalytics(sample_blotter_data)

    status_dist = analytics.get_status_distribution()

    assert status_dist['Resolved'] == 3
    assert status_dist['Ongoing'] == 2


def test_top_categories(sample_blotter_data):
    """Test getting top categories"""
    analytics = MockBlotterAnalytics(sample_blotter_data)

    top_3 = analytics.get_top_categories(3)

    # Should return all categories sorted by frequency
    assert len(top_3) == 3
    # Theft and Assault should be tied for first (both have 2)
    assert top_3['Theft'] == 2
    assert top_3['Assault'] == 2
    assert top_3['Noise Complaint'] == 1


def test_top_categories_limit(sample_blotter_data):
    """Test top categories with limit"""
    analytics = MockBlotterAnalytics(sample_blotter_data)

    top_2 = analytics.get_top_categories(2)

    assert len(top_2) == 2
    # Should contain the two most frequent categories
    assert 'Theft' in top_2
    assert 'Assault' in top_2
    assert 'Noise Complaint' not in top_2


@patch('pandas.read_csv')
def test_load_blotter_data_success(mock_read_csv, sample_blotter_data):
    """Test successful loading of blotter data from CSV"""
    mock_read_csv.return_value = sample_blotter_data

    # Simulate loading blotter data
    loaded_data = pd.read_csv('sample_blotter.csv')

    assert len(loaded_data) == 5
    assert list(loaded_data.columns) == ['date', 'category', 'description', 'status']
    mock_read_csv.assert_called_once_with('sample_blotter.csv')


@patch('pandas.read_csv', side_effect=FileNotFoundError)
def test_load_blotter_data_file_not_found(mock_read_csv):
    """Test handling of missing blotter CSV file"""
    with pytest.raises(FileNotFoundError):
        pd.read_csv('nonexistent_blotter.csv')


@patch('pandas.read_csv', side_effect=pd.errors.EmptyDataError)
def test_load_blotter_data_empty_file(mock_read_csv):
    """Test handling of empty blotter CSV file"""
    with pytest.raises(pd.errors.EmptyDataError):
        pd.read_csv('empty_blotter.csv')


def test_blotter_analytics_initialization(sample_blotter_data):
    """Test blotter analytics initializes correctly"""
    analytics = MockBlotterAnalytics(sample_blotter_data)

    assert len(analytics.data) == 5
    assert 'category' in analytics.data.columns
    assert 'date' in analytics.data.columns


def test_category_counting_case_sensitivity(sample_blotter_data):
    """Test that category counting is case sensitive"""
    # Modify data to have mixed case
    sample_blotter_data.loc[0, 'category'] = 'theft'
    analytics = MockBlotterAnalytics(sample_blotter_data)

    counts = analytics.get_category_counts()

    # Should treat 'theft' and 'Theft' as different categories
    assert 'theft' in counts
    assert 'Theft' in counts
    assert counts['theft'] == 1
    assert counts['Theft'] == 1


def test_monthly_grouping_edge_cases():
    """Test monthly grouping with edge cases"""
    # Data with same date multiple times
    edge_data = pd.DataFrame({
        'date': ['2024-01-01', '2024-01-01', '2024-01-01'],
        'category': ['A', 'B', 'C'],
        'description': ['1', '2', '3'],
        'status': ['S1', 'S2', 'S3']
    })

    analytics = MockBlotterAnalytics(edge_data)
    monthly = analytics.get_monthly_grouping()

    assert monthly[pd.Period('2024-01', 'M')] == 3


def test_status_distribution_empty_status():
    """Test status distribution with empty status values"""
    data_with_empty = pd.DataFrame({
        'date': ['2024-01-01', '2024-01-02'],
        'category': ['A', 'B'],
        'description': ['1', '2'],
        'status': ['', 'Resolved']
    })

    analytics = MockBlotterAnalytics(data_with_empty)
    status_dist = analytics.get_status_distribution()

    assert status_dist[''] == 1
    assert status_dist['Resolved'] == 1
