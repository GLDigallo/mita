package com.mita.exception;

public record ApiError(
        int status,
        String message
) {
}
