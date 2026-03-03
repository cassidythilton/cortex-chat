// AppDB utility functions
export interface AppDBDocument<T> {
  id: string;
  createdOn: string;
  owner: number;
  content: T;
}

// AppDB toolkit response wrapper
export interface AppDBResponse<T> {
  data: AppDBDocument<T>[];
  status: string;
  statusCode: number;
}

export const extractAppDbData = <T>(
  response: AppDBResponse<T> | AppDBDocument<T> | AppDBDocument<T>[] | T | T[],
): (T & { id?: string; createdOn?: string; owner?: number })[] => {
  // Handle empty response
  if (!response) {
    return [];
  }

  // Handle AppDB toolkit response format (with data, status, statusCode)
  if (
    typeof response === 'object' &&
    'data' in response &&
    Array.isArray((response as any).data)
  ) {
    const appDbResponse = response as AppDBResponse<T>;
    return appDbResponse.data.map((doc) => ({
      ...doc.content,
      id: doc.id,
      createdOn: doc.createdOn,
      owner: doc.owner,
    }));
  }

  const documents = Array.isArray(response) ? response : [response];

  return documents.map((doc: any) => {
    // If the document has a content property, it's wrapped
    if (doc && typeof doc === 'object' && 'content' in doc) {
      return {
        ...doc.content,
        id: doc.id,
        createdOn: doc.createdOn,
        owner: doc.owner,
      };
    }
    // Otherwise, it's already unwrapped or is the raw data
    return doc;
  });
};
