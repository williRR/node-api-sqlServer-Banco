USE Banco;
GO

/*
Procedimiento almacenado para crear nuevos clientes
Mejorado con validaciones m�s robustas y manejo completo de transacciones.
*/
CREATE OR ALTER PROCEDURE sp_crearCliente
    @cliepaterno VARCHAR(25),
    @cliematerno VARCHAR(25),
    @clienombre VARCHAR(30),
    @cliedni VARCHAR(14),
    @clienacimiento DATE,
    @clieciudad VARCHAR(30),
    @cliedireccion VARCHAR(50),
    @clietelefono VARCHAR(20) = NULL,
    @clieemail VARCHAR(50) = NULL
AS
BEGIN
    -- Suprime los mensajes de conteo de filas para un mejor rendimiento
    SET NOCOUNT ON;

    -- Declarar variables para el usuario y la clave generados
    DECLARE @clieusuario VARCHAR(15);
    DECLARE @clieclave VARCHAR(15);
    DECLARE @ClienteID INT; -- Variable para capturar el ID
    
    -- Inicia la estructura de manejo de errores y transacciones
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Validaci�n de cliente duplicado
        IF EXISTS (SELECT 1 FROM Cliente WHERE chr_cliedni = @cliedni)
        BEGIN
            THROW 50000, 'Error: El cliente con este DNI ya existe.', 1;
        END

        -- 2. Validaci�n del tel�fono (solo d�gitos)
        IF ISNULL(@clietelefono, '') <> '' AND @clietelefono LIKE '%[^0-9]%'
        BEGIN
            THROW 50000, 'Error: El tel�fono debe contener solo d�gitos.', 1;
        END

        -- 3. Validaci�n de correo electr�nico 
        IF ISNULL(@clieemail, '') <> '' AND @clieemail NOT LIKE '%_@_%._%'
        BEGIN
            THROW 50000, 'Error: El formato del correo electr�nico no es v�lido.', 1;
        END

        IF ISNULL ( @clienacimiento,'')<> '' AND @clienacimiento  > getdate()
        BEGIN
            THROW 50000, 'Error: la fecha de nacimiento no es v�lido.', 1;
        END


        SET @clieclave = LEFT(REPLACE(CAST(NEWID() AS VARCHAR(50)),'-',''),8)

        SET @clieusuario = LEFT(@cliepaterno,1) + LEFT(@cliematerno,1) + SUBSTRING(@clieclave,1,4)
        


        -- Si todas las validaciones pasan, se procede con la inserci�n
        INSERT INTO Cliente (
            chr_cliedni,
            vch_cliepaterno,
            vch_cliematerno,
            vch_clienombre,
            dtt_clienacimiento,
            vch_clieciudad,
            vch_cliedireccion,
            vch_clietelefono,
            vch_clieemail,
            vch_clieusuario,
            vch_clieclave
        )
        VALUES (
            @cliedni,
            @cliepaterno,
            @cliematerno,
            @clienombre,
            @clienacimiento,
            @clieciudad,
            @cliedireccion,
            @clietelefono,
            @clieemail,
            @clieusuario,
            @clieclave

            
        );

        -- ✅ CAPTURAR EL ID DEL CLIENTE CREADO
        SET @ClienteID = SCOPE_IDENTITY();

        -- Confirma la transacci�n si la inserci�n fue exitosa
        COMMIT TRANSACTION;

        -- ✅ DEVOLVER RESULTADO CON SELECT (ESTO FALTABA!)
        SELECT 
            @ClienteID AS ClienteID,
            @clienombre AS Nombre,
            @cliepaterno AS Paterno,
            @cliematerno AS Materno,
            @cliedni AS DNI,
            @clieemail AS Email,
            @clieusuario AS Usuario,
            @clieclave AS Clave,
            'Cliente creado exitosamente' AS Mensaje,
            1 AS Exito;

    END TRY
    BEGIN CATCH
        -- Captura la informaci�n del error
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        -- Si hay una transacci�n activa, la revierte para evitar inconsistencias
        IF XACT_STATE() <> 0
        BEGIN
            ROLLBACK TRANSACTION;
        END;

        -- ✅ DEVOLVER ERROR CON SELECT
        SELECT 
            0 AS ClienteID,
            @ErrorMessage AS Mensaje,
            ERROR_NUMBER() AS ErrorNumero,
            0 AS Exito;
        
        RETURN;
    END CATCH;
END;
GO

-- Probar el procedimiento
PRINT '🧪 Probando procedimiento mejorado...';
GO

EXEC sp_crearCliente 
    @cliepaterno = 'Test',
    @cliematerno = 'Prueba',
    @clienombre = 'Usuario',
    @cliedni = '9999999999999',
    @clienacimiento = '1990-01-01',
    @clieciudad = 'Guatemala',
    @cliedireccion = 'Zona 10',
    @clietelefono = '12345678',
    @clieemail = 'test@prueba.com';
GO


