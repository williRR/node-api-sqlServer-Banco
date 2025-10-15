USE Banco;
GO

CREATE OR ALTER PROCEDURE sp_crearNegocio
    @negonombre VARCHAR(50),
    @negnit VARCHAR(11),
    @negociudad VARCHAR(30),
    @negodireccion VARCHAR(50),
    @negotelefono VARCHAR(20) = NULL,
    @negoemail VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT OFF; -- ✅ Importante para manejar errores manualmente
    
    DECLARE @negusuario VARCHAR(15);
    DECLARE @negclave VARCHAR(15);
    DECLARE @NegocioID INT;

    BEGIN TRY
        -- 1. Validar campos obligatorios (SIN BEGIN TRANSACTION todavía)
        IF @negonombre IS NULL OR @negnit IS NULL OR @negociudad IS NULL OR @negodireccion IS NULL
        BEGIN
            SELECT 
                0 AS NegocioID,
                'Todos los campos obligatorios (nombre, NIT, ciudad, dirección) deben ser proporcionados.' AS Mensaje,
                50001 AS ErrorNumero,
                0 AS Exito;
            RETURN;
        END

        -- 2. Validar que el NIT no exista ya (SIN BEGIN TRANSACTION todavía)
        IF EXISTS (SELECT 1 FROM Negocio WHERE chr_negnit = @negnit)
        BEGIN
            SELECT 
                0 AS NegocioID,
                'El NIT especificado ya se encuentra registrado.' AS Mensaje,
                50002 AS ErrorNumero,
                0 AS Exito;
            RETURN;
        END

        -- 3. Generar clave y usuario
        SET @negclave = LEFT(REPLACE(CAST(NEWID() AS VARCHAR(50)),'-',''),8);
        SET @negusuario = LEFT(@negonombre,2) + SUBSTRING(@negclave,1,5);

        -- 4. Validar que el nombre de usuario no exista ya (SIN BEGIN TRANSACTION todavía)
        IF EXISTS (SELECT 1 FROM Negocio WHERE vch_negusuario = @negusuario)
        BEGIN
            SELECT 
                0 AS NegocioID,
                'El nombre de usuario especificado ya se encuentra registrado.' AS Mensaje,
                50003 AS ErrorNumero,
                0 AS Exito;
            RETURN;
        END

        -- 5. Validar formato de email
        IF @negoemail IS NOT NULL AND @negoemail <> '' AND @negoemail NOT LIKE '%_@_%._%'
        BEGIN
            SELECT 
                0 AS NegocioID,
                'El formato del correo electrónico no es válido.' AS Mensaje,
                50004 AS ErrorNumero,
                0 AS Exito;
            RETURN;
        END

        -- 6. Validar que el teléfono solo contenga dígitos
        IF @negotelefono IS NOT NULL AND @negotelefono <> '' AND @negotelefono LIKE '%[^0-9]%'
        BEGIN
            SELECT 
                0 AS NegocioID,
                'El teléfono debe contener solo dígitos.' AS Mensaje,
                50005 AS ErrorNumero,
                0 AS Exito;
            RETURN;
        END

        -- ✅ AHORA SÍ: Iniciar transacción SOLO si pasamos todas las validaciones
        BEGIN TRANSACTION;

        -- 7. Insertar el nuevo registro
        INSERT INTO Negocio (
            vch_negonombre,
            chr_negnit,
            vch_negociudad,
            vch_negodireccion,
            vch_negotelefono,
            vch_negoemail,
            vch_negusuario,
            vch_negclave
        ) VALUES (
            @negonombre,
            @negnit,
            @negociudad,
            @negodireccion,
            @negotelefono,
            @negoemail,
            @negusuario,
            @negclave
        );

        -- 8. Capturar el ID del negocio creado
        SET @NegocioID = SCOPE_IDENTITY();

        COMMIT TRANSACTION;

        -- ✅ DEVOLVER RESULTADO EXITOSO
        SELECT 
            @NegocioID AS NegocioID,
            @negonombre AS Nombre,
            @negnit AS NIT,
            @negociudad AS Ciudad,
            @negodireccion AS Direccion,
            @negotelefono AS Telefono,
            @negoemail AS Email,
            @negusuario AS Usuario,
            @negclave AS Clave,
            'Negocio creado exitosamente' AS Mensaje,
            1 AS Exito;

    END TRY
    BEGIN CATCH
        -- ✅ Hacer rollback SOLO si hay una transacción activa
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        -- Devolver error
        SELECT 
            0 AS NegocioID,
            ERROR_MESSAGE() AS Mensaje,
            ERROR_NUMBER() AS ErrorNumero,
            0 AS Exito;
    END CATCH
END
GO
