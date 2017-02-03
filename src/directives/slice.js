import {proxyListener, PAGE_CHANGED} from '../events';

const sliceListener = proxyListener({[PAGE_CHANGED]: 'onPageChange'});

export default function ({table, size, page = 1}) {

  let currentPage = page;
  let currentSize = size;

  const directive = Object.assign({
    selectPage(p){
      return table.slice({page: p, size: currentSize});
    },
    selectNextPage(){
      return this.selectPage(currentPage + 1);
    },
    selectPreviousPage(){
      return this.selectPage(currentPage - 1);
    },
    changePageSize(size){
      return table.slice({page: 1, size});
    }
  }, sliceListener({emitter: table}));

  directive.onPageChange(({page:p, size:s}) => {
    currentPage = p;
    currentSize = s;
  });


  return directive;
}