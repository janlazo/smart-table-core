import {smartTable} from '../dist/bundle/module.js';

export default ({test}) => {
    test('compose table factory', (t) => {
        const data = [];
        const tableState = {};
        const tableInstance = smartTable({data, tableState}, function ({data: d, tableState: ts}) {
            return {
                getData() {
                    return d;
                },
                getTableState() {
                    return ts;
                }
            };
        });

        t.ok(tableInstance.getData !== undefined && tableInstance.getTableState !== undefined, 'table instance should have extended behaviour');
        t.ok(tableInstance.exec !== undefined, 'table instance should have regular behaviour');
        t.equal(tableInstance.getData(), data, 'all factories should have the same data reference');
        t.equal(tableInstance.getTableState(), tableState, 'all factories should have the same table state reference');
    });
}