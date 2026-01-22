import React, { useState, useEffect, useCallback } from 'react';
import { TextField, Autocomplete, Box, Typography, CircularProgress, Paper } from '@mui/material';
import { Person } from '@mui/icons-material';
import { apiRequest } from '../utils/api';

const SmartResidentSearch = ({
  value,
  onChange,
  label = 'Search Resident',
  required = false,
  error = false,
  helperText = '',
}) => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const fetchResidents = useCallback(async (search = '') => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;

      const response = await apiRequest('residents', { params });
      const responseData = await response.json();
      const residentsList = Array.isArray(responseData) ? responseData : responseData.data || [];

      setResidents(
        residentsList.map(resident => ({
          id: resident.Resident_ID,
          name: `${resident.First_Name} ${resident.Middle_Name || ''} ${resident.Last_Name}`.trim(),
          address: resident.sitio_name
            ? `${resident.sitio_name}, Household ${resident.Household_ID}`
            : `Household ${resident.Household_ID}`,
          email: resident.Email,
          original: resident,
        }))
      );
    } catch (error) {
      console.error('Error fetching residents:', error);
      setResidents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchResidents(inputValue);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [inputValue, fetchResidents]);

  const handleChange = (event, newValue) => {
    if (newValue) {
      onChange(newValue.original);
    } else {
      onChange(null);
    }
  };

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
  };

  return (
    <Autocomplete
      id='smart-resident-search'
      options={residents}
      getOptionLabel={option => {
        if (typeof option === 'string') return option;
        return option.name || '';
      }}
      filterOptions={x => x} // Disable built-in filtering
      autoComplete
      includeInputInList
      filterSelectedOptions
      disablePortal // Keep this for Modal/Dialog support
      value={
        value
          ? {
              id: value.Resident_ID || value.id,
              name: `${value.First_Name} ${value.Middle_Name || ''} ${value.Last_Name}`.trim(),
              original: value,
            }
          : null
      }
      isOptionEqualToValue={(option, value) => option.id === (value.id || value.Resident_ID)}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      loading={loading}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error}
          helperText={helperText}
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color='inherit' size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component='li' {...props} key={option.id}>
          <Person sx={{ mr: 1, color: 'primary.main' }} />
          <Box>
            <Typography variant='body2'>{option.name}</Typography>
            <Typography variant='caption' color='text.secondary'>
              Resident • {option.address}
            </Typography>
          </Box>
        </Box>
      )}
      noOptionsText={inputValue ? 'No residents found' : 'Type to search...'}
    />
  );
};

export default SmartResidentSearch;
