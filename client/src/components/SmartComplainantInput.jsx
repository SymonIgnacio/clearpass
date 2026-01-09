import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TextField,
  Autocomplete,
  Box,
  Typography,
  Chip,
  Paper
} from '@mui/material';
import { Person, PersonAdd } from '@mui/icons-material';
import { apiRequest } from '../utils/api';

const SmartComplainantInput = ({ value, onChange, label = "Complainant Name" }) => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiRequest('residents');
      const data = await response.json();
      setResidents(data.map(resident => ({
        id: resident.Resident_ID,
        name: `${resident.First_Name} ${resident.Middle_Name || ''} ${resident.Last_Name}`.trim(),
        address: `Household ${resident.Household_ID}`,
        mobile: resident.Mobile_Number,
        isResident: true
      })));
    } catch (error) {
      console.error('Error fetching residents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (event, newValue) => {
    if (typeof newValue === 'string') {
      // Manual entry
      onChange({
        name: newValue,
        isResident: false,
        residentId: null
      });
    } else if (newValue && newValue.isResident) {
      // Selected resident
      onChange({
        name: newValue.name,
        address: newValue.address,
        mobile: newValue.mobile,
        isResident: true,
        residentId: newValue.id
      });
    } else {
      onChange(null);
    }
  };

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
    // If user is typing and no resident is selected, treat as manual entry
    if (newInputValue && !residents.some(r => r.name === newInputValue)) {
      onChange({
        name: newInputValue,
        isResident: false,
        residentId: null
      });
    }
  };

  return (
    <Autocomplete
      freeSolo
      options={residents}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        return option.name || '';
      }}
      value={value?.name || ''}
      onChange={handleChange}
      inputValue={inputValue || value?.name || ''}
      onInputChange={handleInputChange}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          variant="outlined"
          fullWidth
          helperText={value?.isResident ? 
            `✓ Linked to resident: ${value.name}` : 
            "Type to search residents or enter a new name"
          }
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Person sx={{ mr: 1, color: 'primary.main' }} />
          <Box>
            <Typography variant="body2">{option.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              Resident • {option.address}
            </Typography>
          </Box>
        </Box>
      )}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            variant="outlined"
            label={option.name}
            icon={option.isResident ? <Person /> : <PersonAdd />}
            {...getTagProps({ index })}
          />
        ))
      }
      PaperComponent={({ children, ...other }) => (
        <Paper {...other}>
          {children}
          {inputValue && !residents.some(r => r.name.toLowerCase().includes(inputValue.toLowerCase())) && (
            <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                <PersonAdd sx={{ fontSize: 14, mr: 0.5 }} />
                Press Enter to add "{inputValue}" as non-resident
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    />
  );
};

export default SmartComplainantInput;