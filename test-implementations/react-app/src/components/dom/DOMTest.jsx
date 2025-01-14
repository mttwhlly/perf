import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const DOMTest = ({ list, virtualScroll, updates }) => {
  const [items, setItems] = useState([]);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const updateInterval = useRef(null);

  // Generate nested structure for each item
  const generateNestedElement = useCallback((depth = 0) => {
    if (depth >= list.itemTemplate.nesting) return null;
    
    return Array.from({ length: list.itemTemplate.elements }, (_, i) => (
      <div key={i} className="nested-element">
        <span>Element {i}</span>
        {generateNestedElement(depth + 1)}
      </div>
    ));
  }, [list.itemTemplate.nesting, list.itemTemplate.elements]);

  // Initialize items
  useEffect(() => {
    setItems(Array.from({ length: list.items }, (_, i) => ({
      id: i,
      value: Math.random(),
      nested: generateNestedElement()
    })));
  }, [list.items, generateNestedElement]);

  // Setup periodic updates
  useEffect(() => {
    updateInterval.current = setInterval(() => {
      setItems(current => {
        const newItems = [...current];
        for (let i = 0; i < updates.batchSize; i++) {
          const index = Math.floor(Math.random() * newItems.length);
          newItems[index] = {
            ...newItems[index],
            value: Math.random()
          };
        }
        return newItems;
      });
    }, 1000 / updates.frequency);

    return () => clearInterval(updateInterval.current);
  }, [updates.frequency, updates.batchSize]);

  const Row = useCallback(({ index, style }) => (
    <div style={style} className="list-item">
      <div className="item-header">Item {index}</div>
      <div className="item-value">{items[index]?.value.toFixed(4)}</div>
      {items[index]?.nested}
    </div>
  ), [items]);

  return (
    <div className="dom-test" style={{ height: '100vh' }}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={virtualScroll.totalItems}
            itemSize={50}
            onItemsRendered={({ visibleStartIndex, visibleStopIndex }) => {
              setVisibleRange({
                start: visibleStartIndex,
                end: visibleStopIndex
              });
            }}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
      
      <div className="metrics">
        <div>Visible Range: {visibleRange.start} - {visibleRange.end}</div>
        <div>Total Items: {items.length}</div>
        <div>Update Frequency: {updates.frequency}Hz</div>
      </div>
    </div>
  );
};

export default DOMTest;