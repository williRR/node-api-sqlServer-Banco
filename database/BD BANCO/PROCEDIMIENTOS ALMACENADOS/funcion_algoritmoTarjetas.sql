USE Banco
GO

-- Función para calcular el dígito de control (último dígito) usando el Algoritmo de Luhn
CREATE FUNCTION dbo.fn_CalcularDigitoLuhn (@NumeroSinDigito VARCHAR(MAX))
RETURNS CHAR(1)
AS
BEGIN
    DECLARE @Length INT = LEN(@NumeroSinDigito);
    DECLARE @Index INT = @Length;
    DECLARE @Digit INT;
    DECLARE @DoubledDigit INT;
    DECLARE @Sum INT = 0;
    DECLARE @IsSecondDigit BIT = 0; -- Indicador para duplicar cada segundo dígito, comenzando desde el penúltimo (derecha a izquierda)

    -- Recorrer la cadena de derecha a izquierda
    WHILE @Index >= 1
    BEGIN
        SET @Digit = CAST(SUBSTRING(@NumeroSinDigito, @Index, 1) AS INT);

        IF @IsSecondDigit = 1
        BEGIN
            SET @DoubledDigit = @Digit * 2;
            
            -- Si el resultado de duplicar es > 9, sumar sus dígitos (ej: 12 -> 1+2 = 3)
            IF @DoubledDigit > 9
                SET @DoubledDigit = @DoubledDigit - 9; -- Es equivalente a (1 + (DoubledDigit % 10))
                
            SET @Sum = @Sum + @DoubledDigit;
        END
        ELSE
        BEGIN
            SET @Sum = @Sum + @Digit;
        END

        SET @IsSecondDigit = 1 - @IsSecondDigit; -- Alternar el indicador
        SET @Index = @Index - 1;
    END

    -- El dígito de control es el valor necesario para que (SumaTotal + DigitoControl) sea un múltiplo de 10.
    -- DigitoControl = (10 - (SumaTotal MOD 10)) MOD 10
    DECLARE @CheckDigit INT = (10 - (@Sum % 10)) % 10;

    RETURN CAST(@CheckDigit AS CHAR(1));
END
GO