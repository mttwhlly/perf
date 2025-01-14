import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createSelector } from '@reduxjs/toolkit';

const RealtimeUpdates = ({ frequency, dataSize, transformations }) => {
  const [data, setData] = useState([]);
  const [transformedData, setTransformedData] = useState([]);

  // Memoized selectors for transformations
  const transformSelectors = useMemo(() => ({
    sort: createSelector(
      [(state) => state],
      (items) => [...items].sort((a, b) => b.value - a.value)
    ),
    filter: createSelector(
      [(state) => state],
      (items) => items.filter(item => item.value > 0.5)
    ),
    aggregate: createSelector(
      [(state) => state],
      (items) => {
        const sum = items.reduce((acc, item) => acc + item.value, 0);
        return [{ total: sum, average: sum / items.length }];
      }
    )
  }), []);

  // Apply transformations in sequence
  const applyTransformations = useCallback((currentData) => {
    return transformations.reduce((result, transform) => {
      return transformSelectors[transform](result);
    }, currentData);
  }, [transformations, transformSelectors]);

  // Setup real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = Array.from({ length: dataSize }, (_, i) => ({
        id: i,
        value: Math.random(),
        timestamp: Date.now()
      }));
      setData(newData);
      setTransformedData(applyTransformations(newData));
    }, 1000 / frequency);

    return () => clearInterval(interval);
  }, [frequency, dataSize, applyTransformations]);

  return (
    <div className="realtime-updates">
      <div className="statistics">
        <div>Total Items: {data.length}</div>
        <div>Update Frequency: {frequency}Hz</div>
        <div>Active Transformations: {transformations.join(', ')}</div>
      </div>
      <div className="data-visualization">
        {/* Render transformed data */}
        {transformedData.map(item => (
          <div
            key={item.id}
            className="data-item"
            style={{
              height: `${item.value * 100}px`,
              backgroundColor: `hsl(${item.value * 360}, 50%, 50%)`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default RealtimeUpdates;