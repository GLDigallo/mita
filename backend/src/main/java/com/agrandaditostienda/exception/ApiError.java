package com.agrandaditostienda.exception;

public record ApiError(
        int status,
        String message
) {
}
