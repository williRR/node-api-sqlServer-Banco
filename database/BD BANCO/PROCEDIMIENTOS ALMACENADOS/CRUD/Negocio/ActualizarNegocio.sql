USE Banco
GO

CREATE OR ALTER PROCEDURE sp_actualizarNegocio
    @negocodigo INT,
    @negonombre VARCHAR(50) = NULL,
    @negnit VARCHAR(11) = NULL,
    @negociudad VARCHAR(30) = NULL,
    @negodireccion VARCHAR(50) = NULL,
    @negotelefono VARCHAR(20) = NULL,
    @negoemail VARCHAR(50) = NULL,
    @negusuario VARCHAR(15) = NULL,
    @negclave VARCHAR(15) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Validar que el negocio exista
        IF NOT EXISTS (SELECT 1 FROM Negocio WHERE int_negocodigo = @negocodigo)
        BEGIN
            RAISERROR('El negocio con el código especificado no existe.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 2. Validar si el nuevo NIT ya está en uso (excluyendo el propio registro)
        IF @negnit IS NOT NULL AND EXISTS (SELECT 1 FROM Negocio WHERE chr_negnit = @negnit AND int_negocodigo <> @negocodigo)
        BEGIN
            RAISERROR('El nuevo NIT ya se encuentra registrado por otro negocio.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 3. Validar si el nuevo usuario ya está en uso (excluyendo el propio registro)
        IF @negusuario IS NOT NULL AND EXISTS (SELECT 1 FROM Negocio WHERE vch_negusuario = @negusuario AND int_negocodigo <> @negocodigo)
        BEGIN
            RAISERROR('El nuevo nombre de usuario ya se encuentra en uso por otro negocio.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 4. Actualizar el registro
        UPDATE Negocio
        SET
            vch_negonombre = ISNULL(@negonombre, vch_negonombre),
            chr_negnit = ISNULL(@negnit, chr_negnit),
            vch_negociudad = ISNULL(@negociudad, vch_negociudad),
            vch_negodireccion = ISNULL(@negodireccion, vch_negodireccion),
            vch_negotelefono = ISNULL(@negotelefono, vch_negotelefono),
            vch_negoemail = ISNULL(@negoemail, vch_negoemail),
            vch_negusuario = ISNULL(@negusuario, vch_negusuario),
            vch_negclave = ISNULL(@negclave, vch_negclave)
        WHERE int_negocodigo = @negocodigo;

        COMMIT TRANSACTION;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000);
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO