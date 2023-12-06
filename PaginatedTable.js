import React from 'react';
import PropTypes from 'prop-types';
import Table from '@common/Table';
import Spinner from 'react-bootstrap/Spinner';
import SearchDropdown from '../../LogsheetReader/App/Components/Search/SearchDropdown/SearchDropdown';
import PaginatedRow from './PaginatedRow';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { usePaginatedTable } from './hooks/usePaginatedTable';
import './paginated-table.css';

/**
 *
 * # Paginated Table
 *
 * Displays all data from the given table
 * Subdirectories like /path/<columnname> display data from the given table filtered by column name
 * Searching is also available
 *
 * ## Basic usage
 *
 * <PaginatedTable
 *    className="tracks"
 *    title="Tracks"
 *    dropdownPageLimits={[15, 30, 50]}
 *    cellsToDisplay={[{ title: 'Track', name: 'track', orderName: 'track', size: 'm' }]}
 *    columnsToFilter={[{ title: 'Track', name: 'track' }]}
 *    defaultOrder={['track asc']}
 *    onError={handleError}
 *    onFetchData={getTracks}
 *    // note that the getTracks method must return a pagination object (see below)
 *    onRowClick={onRowClick}
 * />
 *
 * ## Custom Cell Rendering
 *
 * To use your own custom cells in the table, you must pass them as children to the PaginatedTable component.
 *
 * For example:
 *  <PaginatedTable {...props} cellsToDisplay={[ { title: 'Track', name: 'track', orderName: 'track', size: 'm' } ]}>
 *   <CustomCell cellId="track" />
 * </PaginatedTable>
 *
 * The cellId must match the name of the cell in cellsToDisplay
 * In the CustomCell component, you can access the rowData and cellValue prop to render the cell value or do something else with it
 *
 *
 * ## Api Calls
 *
 * The onFetchData prop is an async function that fetches data from the api
 * It must return a promise that resolves to an object with the following schema:
 *
 * Schema for pagination result (returned by your custom callback, 'onFetchData')
 * {
 *    "totalEntries": 16,
 *    "totalRows": 5,
 *    "totalPages": 4,
 *    "currentPage": 1,
 *    "limit": 5
 *    "offset": 0,
 *    "items": [ {}, {}, {} ]
 *    "query" : "...." (only for debugging in dev)
 * }
 *
 * When fetchData is called, it is called with the following object as an argument:
 *
 * For example: onFetchData({columns, limit, offset, order, filter, abortToken })
 *
 * columns: the columns to search
 * limit: the page limit
 * offset: the offset
 * order: the order
 * filter: the filter
 * abortToken: Currently, this is a customized abort token, an empty object which can
 * be used to abort the request. When the request is cancelled by PaginatedTable,
 * the abortToken calls the abort method on the object. In this custom implementation,
 * the request must pass the abort object a cancel method, which PaginatedTable still has
 * reference to. See xhr.js for more details.
 *
 *
 *
 * @component
 *
 */
export default function PaginatedTable({
  className,
  title,
  defaultOrder = ['id asc'],
  path = '',
  onError,
  onFetchData,
  onRowClick,
  cellsToDisplay = [],
  columnsToFilter = [],
  dropdownPageLimits = [15, 30, 50],
  children,
}) {
  const {
    columnIndex,
    tableData,
    tableOptions,
    pagination,
    loading,
    handlePageLimitChange,
    handlePageChange,
    handleOrderChange,
    handleSearchColumnChange,
    handleFilterChange,
  } = usePaginatedTable({
    title,
    defaultOrder,
    path,
    onError,
    onFetchData,
    columnsToFilter,
    dropdownPageLimits,
  });
  return (
    <div className={className}>
      {loading && <Spinner className="table-spinner" animation="border" />}
      {!tableData ? null : (
        <Table
          dataSource={tableData}
          className="search-result-table"
          enableCheckbox={false}
          onChangeOrder={handleOrderChange}
          onFilterChange={handleFilterChange}
        >
          <Table.TitleBar
            title={tableOptions.title}
            initialFilterValue={tableOptions.filter}
            filterTitle={
              <SearchDropdown
                items={columnsToFilter}
                selectedIndex={columnIndex}
                onChange={handleSearchColumnChange}
              />
            }
          >
            <FontAwesomeIcon icon={faSearch} />
          </Table.TitleBar>
          <Table.Pagination
            pagination={pagination}
            dropdownList={dropdownPageLimits}
            onDropdownChange={handlePageLimitChange}
            onPageChange={handlePageChange}
          />
          {/* Header Cells  */}

          <Table.Head>
            {cellsToDisplay.map((cell, index) => {
              return (
                <Table.Cell
                  index={cell.index}
                  key={cell.name}
                  name={cell.name}
                  title={cell?.title}
                  orderName={cell.orderName}
                  size={cell.size}
                />
              );
            })}
          </Table.Head>
          {/* Table Body */}

          <Table.Body>
            <PaginatedRow
              cellsToDisplay={cellsToDisplay}
              filter={tableOptions.filter}
              searchColumns={tableOptions.columns}
              onRowClick={onRowClick}
              children={children}
            />
          </Table.Body>
        </Table>
      )}
      {tableData && tableData.length === 0 && <div className="no-results">No results found</div>}
    </div>
  );
}

PaginatedTable.propTypes = {
  /**
   * Class name
   */
  className: PropTypes.string,
  /**
   * Table title
   */
  title: PropTypes.string,
  /**
   * Default order
   * Example: ['id asc', 'artist desc']
   */
  defaultOrder: PropTypes.arrayOf(PropTypes.string),
  /**
   * Path
   * Example: /tracks (the base path after which all queries and subdirs are appended)
   */
  path: PropTypes.string,
  /**
   * On error
   */
  onError: PropTypes.func,
  /**
   * On fetch data
   * The async function that fetches data
   *
   * In order to use this function, it must return a promise that resolves to an
   *  object with the following schema:
   *
   *  Schema for pagination result
   * {
   *    "totalEntries": 16,
   *    "totalRows": 5,
   *    "totalPages": 4,
   *    "currentPage": 1,
   *    "limit": 5
   *    "offset": 0,
   *    "items": [ {}, {}, {} ]
   *    "query" : "...." (only for debugging in dev)
   * }
   */
  onFetchData: PropTypes.func,
  /**
   * On row click
   * The function that is called when a row is clicked
   */
  onRowClick: PropTypes.func,
  /**
   * Cells to display
   */
  cellsToDisplay: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      name: PropTypes.string,
      orderName: PropTypes.string,
      size: PropTypes.string,
    })
  ),
  /**
   * Columns to filter
   */
  columnsToFilter: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      name: PropTypes.string,
      orderName: PropTypes.string,
      size: PropTypes.string,
    })
  ),
  /**
   * Dropdown page limits
   */
  dropdownPageLimits: PropTypes.arrayOf(PropTypes.number),
};
