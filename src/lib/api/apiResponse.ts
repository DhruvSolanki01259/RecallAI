import { NextResponse } from "next/server";

export function successResponse<T>(
  message = "Request successful",
  status = 200,
  data: T,
) {
  return NextResponse.json(
    {
      success: true,
      error: null,
      message,
      data,
    },
    { status },
  );
}

export function errorResponse(
  message = "Something went wrong",
  status = 500,
  error?: { name?: string; message?: string; cause?: unknown },
) {
  return NextResponse.json(
    {
      success: false,
      message,
      data: null,
      error: error ?? null,
    },
    { status },
  );
}
