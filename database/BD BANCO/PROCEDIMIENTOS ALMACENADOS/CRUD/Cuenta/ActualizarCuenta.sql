
--Procedimiento para Actualizar el Estado de una Cuenta (`sp_actualizarEstadoCuenta`)

--Este procedimiento almacenado cambia el estado de una cuenta. La validación se encarga de asegurar que el nuevo estado sea uno de los valores permitidos en la tabla (`'ACTIVO'`, `'ANULADO'`, `'CANCELADO'`).

--```sql
USE Banco
GO

CREATE OR ALTER PROCEDURE sp_actualizarEstadoCuenta
    @cuencodigo INT,
    @nuevoEstado VARCHAR(15)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Validar que la cuenta exista
        IF NOT EXISTS (SELECT 1 FROM Cuenta WHERE int_cuencodigo = @cuencodigo)
        BEGIN
            RAISERROR('El código de cuenta no existe.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 2. Validar que el nuevo estado sea uno de los permitidos
        IF @nuevoEstado NOT IN ('ACTIVO', 'ANULADO', 'CANCELADO')
        BEGIN
            RAISERROR('El estado proporcionado no es válido. Los estados permitidos son: ACTIVO, ANULADO, CANCELADO.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 3. Actualizar el estado de la cuenta
        UPDATE Cuenta
        SET vch_cuenestado = @nuevoEstado
        WHERE int_cuencodigo = @cuencodigo;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO