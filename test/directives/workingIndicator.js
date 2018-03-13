import workingIndicator from '../../src/directives/working-indicator';
import {EXEC_CHANGED} from '../../src/events';
import {emitter} from 'smart-table-events';
import test from 'zora';

test('summary directive should be able to register listener', t => {
	let counter = 0;
	const table = emitter();
	const s = workingIndicator({table});
	s.onExecutionChange(() => counter++);
	table.dispatch(EXEC_CHANGED);
	t.equal(counter, 1, 'should have updated the counter');
});
