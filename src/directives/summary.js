import {proxyListener, SUMMARY_CHANGED} from '../events';

const executionListener = proxyListener({[SUMMARY_CHANGED]: 'onSummaryChange'});

export default function ({table}) {
  return executionListener({emitter: table});
}