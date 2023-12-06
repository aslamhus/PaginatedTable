import React from 'react';

import { highlightText } from '../../LogsheetReader/App/Components/Search/AllSearchResults/SearchResults/utils';
/**
 * Find custom cells
 *
 * search for cells with cellId property matching cell.name from cells to display
 *
 * @param {React.Children} children
 * @returns
 */
export const findCustomCells = (children, cellsToDisplay) =>
  React.Children.toArray(children).reduce((acc, child) => {
    const cellName = child.props?.cellId;
    if (cellsToDisplay.find((cell) => cell.name == cellName)) {
      acc[cellName] = child;
    }
    return acc;
  }, {});

/**
 * Get the cell value
 *
 * @returns {string}
 */
export const getCellValue = (cell, rowData, filter, searchColumns) => {
  let value = rowData[cell.name];
  // highlight search terms
  if (filter && (searchColumns === '' || searchColumns.includes(cell.name))) {
    value = highlightText(filter, value, 'search-term-highlight');
  }
  // date format
  if (cell.name == 'air_date') {
    value = new Date(value).toLocaleDateString('en-us', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  return value;
};
