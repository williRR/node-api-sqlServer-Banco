-- =============================================
-- TABLA OrdenPago - Para órdenes de pago de negocios
-- =============================================
CREATE TABLE OrdenPago (
    int_ordenid INT NOT NULL IDENTITY(1000,1),
    int_negocodigo INT NOT NULL,
    vch_codigorden VARCHAR(20) NOT NULL UNIQUE,
    vch_claveacceso VARCHAR(8) NOT NULL,
    dec_monto DECIMAL(18, 2) NOT NULL,
    vch_concepto VARCHAR(200) NOT NULL,
    vch_estado VARCHAR(15) NOT NULL DEFAULT 'PENDIENTE',
    dtt_fechacreacion DATETIME NOT NULL DEFAULT GETDATE(),
    dtt_fechavencimiento DATETIME NOT NULL,
    dtt_fechapago DATETIME NULL,
    int_cliecodigo_pago INT NULL,
    vch_transaccionid VARCHAR(50) NULL,
    
    CONSTRAINT PK_OrdenPago PRIMARY KEY (int_ordenid),
    CONSTRAINT FK_OrdenPago_Negocio FOREIGN KEY (int_negocodigo) REFERENCES Negocio(int_negocodigo),
    CONSTRAINT FK_OrdenPago_Cliente FOREIGN KEY (int_cliecodigo_pago) REFERENCES Cliente(int_cliecodigo),
    CONSTRAINT CHK_OrdenPago_Estado CHECK (vch_estado IN ('PENDIENTE', 'PAGADO', 'VENCIDO', 'CANCELADO'))
);
GO