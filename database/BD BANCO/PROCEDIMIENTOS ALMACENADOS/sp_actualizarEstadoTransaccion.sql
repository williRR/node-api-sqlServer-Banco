
CREATE OR ALTER PROCEDURE sp_actualizarEstadoTransaccion
    @transaccionid INT,
    @nuevoEstado VARCHAR(20), 
    @mensaje VARCHAR(200),
    @cuentareferencia INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE TransaccionPasarela
    SET 
        vch_estado = @nuevoEstado,
        vch_mensaje = @mensaje,                     -- Actualiza el mensaje interno (si es necesario)
        vch_mensaje_banco = @mensaje,               -- 🚨 Usa la columna para el mensaje del banco
        int_cuentareferencia = @cuentareferencia    -- Actualiza la cuenta de referencia
    WHERE 
        int_transaccionid = @transaccionid;

END
GO