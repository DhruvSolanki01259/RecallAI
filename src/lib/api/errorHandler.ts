export function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      cause: error.cause,
    };
  }

  return {
    name: "UnknownError",
    message: "An unknown error occured.",
    cause: undefined,
  };
}
