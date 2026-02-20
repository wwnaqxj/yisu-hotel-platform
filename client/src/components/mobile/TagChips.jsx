import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { useSearch } from '../../context/SearchContext.jsx';

export default function TagChips({ city }) {
  const {
    state: { tags },
    toggleTag,
  } = useSearch();

  const commonTags = ['亲子酒店', '豪华', '免费停车', '机场接送'];
  const citySpecific = {
    北京: ['故宫周边', '商务出差'],
    上海: ['外滩景观', '迪士尼周边'],
  };

  const cityTags = citySpecific[city] || [];
  const all = [...cityTags, ...commonTags];

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        热门标签
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {all.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            size="small"
            clickable
            color={tags.includes(tag) ? 'primary' : 'default'}
            variant={tags.includes(tag) ? 'filled' : 'outlined'}
            onClick={() => toggleTag(tag)}
          />
        ))}
      </Box>
    </Box>
  );
}

