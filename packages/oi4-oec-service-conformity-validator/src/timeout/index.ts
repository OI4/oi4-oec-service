export const promiseTimeout = (promise: any, ms: number, error: string = 'GenericError') => {
  return new Promise<any>((resolve, reject) => {
    setTimeout(() => reject(error), ms);
    promise.then(resolve).catch(reject);
  });
};

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
