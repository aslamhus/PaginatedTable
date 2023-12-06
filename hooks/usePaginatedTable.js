import React, { useEffect, useState, useCallback } from 'react';
import { usePagination } from '../../Table/hooks/usePagination';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { usePrev } from '../../hooks/usePrev';
import { findTableColumnIndexByName } from '../../../LogsheetReader/App/utils/utils';

export const usePaginatedTable = ({
  title,
  defaultOrder,
  onError,
  onFetchData,
  onDataFetched,
  columnsToFilter,
  dropdownPageLimits,
}) => {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tableData, setTableData] = useState(null);
  // get the index of the column to search (default is 0, which is the 'All' column)
  const [columnIndex, setColumnIndex] = useState(
    findTableColumnIndexByName(params.column, columnsToFilter)
  );
  const [tableOptions, setTableOptions] = useState({
    title,
    // get the value of the column to search (default is ['track', 'artist', 'album', 'label'])
    columns: [...columnsToFilter?.[columnIndex]?.value] ?? [],
    filter: searchParams.get('search') || '',
    order: searchParams.get('order')?.split(',') ?? defaultOrder,
  });

  const [loading, setLoading] = useState(false);
  const [abortToken, setAbortToken] = useState({});
  // pagination
  const { pagination, setPagination } = usePagination({
    pageLimit: dropdownPageLimits[0],
    totalItems: tableData?.pagination?.totalEntries || 0,
  });
  // get previous props
  const prevProps = usePrev({ ...tableOptions, ...pagination });

  const handlePageLimitChange = (pageLimit) => {
    // calculate the new page
    // set the page based on the new page limit
    const newTotalPages = Math.floor(pagination.totalItems / pageLimit);
    const newPage = pagination.page > newTotalPages ? newTotalPages : pagination.page;
    setPagination({ ...pagination, page: newPage, pageLimit });
  };

  const handlePageChange = (page) => setPagination({ ...pagination, page });

  const handleFilterChange = (filter) => setTableOptions({ ...tableOptions, filter });

  const handleSearchColumnChange = (colIndex) => {
    // set the column index
    setColumnIndex(colIndex);
    // set the columns to search
    setTableOptions({ ...tableOptions, columns: [...columnsToFilter[colIndex].value] });
  };

  /**
   * Handle order change
   *
   * Updates the order, triggering a data fetch.
   * When the data fetch completes, the table will be updated.
   * We also return to page 1
   *
   *
   * @typedef {object} orderObject
   * @property {string} name - column name
   * @property {string} direction - asc or desc
   *
   * @param {orderObject} order
   */
  const handleOrderChange = ({ name, direction }) => {
    // Example: order = ['track asc']
    setTableOptions({ ...tableOptions, order: [`${name} ${direction}`] });
    setPagination({ ...pagination, page: 1 });
  };

  const handleFetchError = (error) => {
    if (onError instanceof Function) {
      onError(error);
    } else {
      console.error(error);
    }
  };

  /**
   * Fetch data
   *
   * Calls the api to fetch data
   */
  const fetchData = async () => {
    // calc offset
    const pageIndex = pagination.page - 1 ?? 0;
    const limit = pagination?.pageLimit ?? 0;
    const offset = pageIndex * limit;
    // abort any pending requests
    if (abortToken?.abort) {
      abortToken.abort();
    }
    // reset the abort token object which is passed to the api call (see xhr.js docs)
    setAbortToken({});
    // fetch data with table options
    setLoading(true);
    const { columns, filter, order } = tableOptions;
    console.info('fetching data', { columns, filter, order });
    // if no onFetchData function is provided, throw an error
    if (!(onFetchData instanceof Function)) {
      handleFetchError('onFetchData is not a function');
      return;
    }
    // call the onFetchData function
    try {
      const res = await Promise.resolve(
        onFetchData({
          columns,
          limit: pagination.pageLimit,
          offset,
          order,
          filter,
          abortToken,
        })
      );
      handleFetchSuccess(res, tableOptions);
    } catch (error) {
      handleFetchError(error);
    }
    // regardless of success or failure, set loading to false
    setLoading(false);
  };

  /**
   * Handle fetch success
   *
   * @param {object} res - the response from the api call, which must
   * obey the pagination schema set out in propTypes
   * @param {object} tableOptions - the table options
   */
  const handleFetchSuccess = (res, tableOptions) => {
    // update table data and pagination
    setTableData(res?.items);
    setPagination({
      ...pagination,
      totalItems: res?.totalEntries || 0,
    });
    // update the query parameters, i.e. /?search=foo&order=bar&columns=baz
    setSearchParams({
      search: tableOptions.filter,
      order: tableOptions.order,
      columns: tableOptions.columns,
    });
    // call custom callback
    if (onDataFetched instanceof Function) {
      onDataFetched(res);
    }
  };

  /**
   * Handle clean up
   *
   * Cancels any pending requests
   */
  const handleCleanUp = () => {
    if (abortToken?.abort) {
      abortToken.abort();
    }
  };

  /**
   * Fetch data when table options change
   */
  useEffect(() => {
    if (
      prevProps.columns != tableOptions.columns ||
      prevProps.order != tableOptions.order ||
      prevProps.filter != tableOptions.filter ||
      prevProps.pageLimit != pagination.pageLimit ||
      prevProps.page != pagination.page
    ) {
      fetchData();
    }
  }, [
    tableOptions.columns,
    tableOptions.order,
    tableOptions.filter,
    pagination.pageLimit,
    pagination.page,
  ]);

  /**
   * On mount fetch the data
   */
  useEffect(() => {
    fetchData();
  }, []);

  /**
   * On unmount
   *
   * Cancel any pending requests
   */
  useEffect(() => {
    return handleCleanUp;
  }, []);

  return {
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
  };
};
