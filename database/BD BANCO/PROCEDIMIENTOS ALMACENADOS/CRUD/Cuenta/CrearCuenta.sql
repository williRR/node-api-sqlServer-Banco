USE Banco
GO

CREATE OR ALTER PROCEDURE sp_crearCuenta
    @monecodigo VARCHAR(2),
    @sucucodigo VARCHAR(3),
    @emplcreacuenta INT,
    @cliecodigo INT = NULL,
    @negocodigo INT = NULL,
    @cuensaldo DECIMAL(18, 2)
AS
BEGIN
    SET NOCOUNT ON;

    -- Declara variables para el usuario y la clave
    DECLARE @cuenusuario VARCHAR(15);
    DECLARE @cuenclave VARCHAR(6);

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Validar que la cuenta sea para un cliente O un negocio, no para ambos
        IF (@cliecodigo IS NOT NULL AND @negocodigo IS NOT NULL) OR (@cliecodigo IS NULL AND @negocodigo IS NULL)
        BEGIN
            RAISERROR('Una cuenta debe estar asociada a un cliente o a un negocio, pero no a ambos.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 2. Validar que el saldo inicial no sea negativo
        IF @cuensaldo < 0
        BEGIN
            RAISERROR('El saldo inicial de la cuenta no puede ser negativo.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        --- Generar Usuario y Clave
        -- Genera un usuario pseudoaleatorio de 8 caracteres
        SET @cuenusuario = LEFT(REPLACE(CAST(NEWID() AS VARCHAR(50)), '-', ''), 8);

        -- Genera una clave num�rica pseudoaleatoria de 6 d�gitos
        SET @cuenclave = RIGHT('000000' + CAST(ABS(CHECKSUM(NEWID())) % 1000000 AS VARCHAR(6)), 6);

      
        -- Insertar el nuevo registro con usuario y clave
        INSERT INTO Cuenta (
            chr_monecodigo,
            chr_sucucodigo,
            int_emplcreacuenta,
            int_cliecodigo,
            int_negocodigo,
            dec_cuensaldo,
            dtt_cuenfechacreacion,
            int_cuencontmov,
            chr_cuenclave
        ) VALUES (
            @monecodigo,
            @sucucodigo,
            @emplcreacuenta,
            @cliecodigo,
            @negocodigo,
            @cuensaldo,
            GETDATE(),
            0,
            @cuenclave
        );

        -- Opcional: obtener el c�digo de la nueva cuenta
        DECLARE @NewAccountID INT;
        SET @NewAccountID = SCOPE_IDENTITY();

        COMMIT TRANSACTION;

        -- Devolver la informaci�n para la aplicaci�n
        SELECT
            @NewAccountID AS CodigoCuenta,

            @cuenclave AS Clave
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO