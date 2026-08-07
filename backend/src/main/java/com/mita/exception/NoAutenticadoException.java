package com.mita.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.UNAUTHORIZED)
public class NoAutenticadoException extends RuntimeException {

    public NoAutenticadoException() {
        super("No autenticado");
    }
}
