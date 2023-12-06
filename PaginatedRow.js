import React from 'react';
import Table from '../Table';
import { findCustomCells, getCellValue } from './utils';

const PaginatedRow = ({
  rowData,
  cellsToDisplay,
  filter,
  searchColumns,
  onRowClick,
  children,
  ...props
}) => {
  /**
   * Render cells
   *
   * Renders the default or custom cells
   */
  const renderCells = (children, rowData, filter, searchColumns, cellsToDisplay) => {
    // find custom cells
    const customCells = findCustomCells(children, cellsToDisplay);
    // render each cell
    return cellsToDisplay.map((cell, index) => {
      // get value from row data
      let value = getCellValue(cell, rowData, filter, searchColumns);
      // if a custom cell exists, then render it
      let customCell = customCells?.[cell.name];
      if (customCell) {
        // append row data to custom cell props
        const CustomCell = React.cloneElement(customCell, { rowData, cellValue: value });
        return (
          <Table.Cell
            className={'table-cell'}
            key={cell.name}
            name={cell.name}
            value={value}
            size={cell.size}
            index={index}
          >
            {CustomCell}
          </Table.Cell>
        );
      }
      // otherwise return default cell
      return (
        <Table.Cell
          className={'table-cell'}
          key={cell.name}
          name={cell.name}
          value={value}
          size={cell.size}
          index={index}
        >
          <p>{value}</p>
        </Table.Cell>
      );
    });
  };

  const handleRowClick = (event) => {
    if (onRowClick instanceof Function) {
      onRowClick(rowData, event);
    }
  };

  return (
    <Table.Row rowData={rowData} {...props} onClick={handleRowClick}>
      <Table.Row.Cells>
        {renderCells(children, rowData, filter, searchColumns, cellsToDisplay)}
      </Table.Row.Cells>
    </Table.Row>
  );
};

export default PaginatedRow;
