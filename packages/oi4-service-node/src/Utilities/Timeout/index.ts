const promiseTimeout = (promise: any, ms: number, error: string = 'GenericError') => {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(error), ms);
    promise.then(resolve).catch(reject);
  });
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = { promiseTimeout, delay };
