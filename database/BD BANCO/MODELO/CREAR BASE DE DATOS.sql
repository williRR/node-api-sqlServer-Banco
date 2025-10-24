/*
Empresa : Banco
Software : Sistema de Cuentas y transacciones entre negocios
DBMS : SQL Server
Base de Datos : Banco
Script : Crea la Base de Datos
*/

-- =============================================
-- Creación de la Base de Datos
-- =============================================

USE master;
GO

IF( EXISTS ( SELECT name FROM master.sys.databases WHERE name = 'Banco' ) )
BEGIN
    DROP DATABASE Banco;
END;
GO

CREATE DATABASE Banco;
GO

-- =============================================
-- Seleccionar la Base de Datos
-- =============================================

USE Banco;
GO

-- =============================================
-- TABLA TipoMovimiento
-- =============================================
CREATE TABLE TipoMovimiento (
    int_tipocodigo INT NOT NULL IDENTITY (1,1),
    vch_tipodescripcion VARCHAR(40) NOT NULL,
    vch_tipoaccion VARCHAR(10) NOT NULL,
    vch_tipoestado VARCHAR(15) NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT PK_TipoMovimiento PRIMARY KEY (int_tipocodigo),
    CONSTRAINT CHK_TipoMovimiento_Accion CHECK (vch_tipoaccion IN ('INGRESO', 'SALIDA')),
    CONSTRAINT CHK_TipoMovimiento_Estado CHECK (vch_tipoestado IN ('ACTIVO', 'ANULADO', 'CANCELADO'))
);
GO

-- =============================================
-- TABLA Sucursal
-- =============================================
CREATE TABLE Sucursal (
    chr_sucucodigo VARCHAR(3) NOT NULL,
    vch_sucunombre VARCHAR(50) NOT NULL,
    vch_sucuciudad VARCHAR(30) NOT NULL,
    vch_sucudireccion VARCHAR(50) NULL,
    int_sucucontcuenta INT NOT NULL,
    CONSTRAINT PK_Sucursal PRIMARY KEY (chr_sucucodigo)
);
GO

-- =============================================
-- TABLA Empleado
-- =============================================
CREATE TABLE Empleado (
    int_emplcodigo INT NOT NULL IDENTITY(100,1),
    vch_empldni VARCHAR(14) NOT NULL,
    vch_emplpaterno VARCHAR(25) NOT NULL,
    vch_emplmaterno VARCHAR(25) NOT NULL,
    vch_emplnombre VARCHAR(30) NOT NULL,
    vch_emplciudad VARCHAR(30) NOT NULL,
    chr_emplgenero CHAR(1) NOT NULL CHECK (chr_emplgenero IN ('M', 'F')),
    vch_empldireccion VARCHAR(50) NULL,
    vch_emplusuario VARCHAR(15) NOT NULL,
    vch_emplclave VARCHAR(15) NOT NULL,
    CONSTRAINT PK_Empleado PRIMARY KEY (int_emplcodigo),
    CONSTRAINT U_Empleado_vch_emplusuario UNIQUE (vch_emplusuario)
);
GO

-- =============================================
-- TABLA Asignado
-- =============================================
CREATE TABLE Asignado (
    int_asigcodigo INT NOT NULL IDENTITY(1000,1),
    chr_sucucodigo VARCHAR(3) NOT NULL,
    int_emplcodigo INT NOT NULL,
    dtt_asigfechaalta DATETIME NOT NULL,
    dtt_asigfechabaja DATETIME NULL,
    CONSTRAINT PK_Asignado PRIMARY KEY (int_asigcodigo),
    CONSTRAINT FK_Asignado_Sucursal FOREIGN KEY (chr_sucucodigo) REFERENCES Sucursal(chr_sucucodigo),
    CONSTRAINT FK_Asignado_Empleado FOREIGN KEY (int_emplcodigo) REFERENCES Empleado(int_emplcodigo)
);
GO

-- =============================================
-- TABLA Cliente
-- =============================================
CREATE TABLE Cliente (
    int_cliecodigo INT NOT NULL IDENTITY(100,1),
    vch_cliepaterno VARCHAR(25) NOT NULL,
    vch_cliematerno VARCHAR(25) NOT NULL,
    vch_clienombre VARCHAR(30) NOT NULL,
    chr_cliedni VARCHAR(14) NOT NULL,
    dtt_clienacimiento DATE NOT NULL CHECK (dtt_clienacimiento < GETDATE()),
    vch_clieciudad VARCHAR(30) NOT NULL,
    vch_cliedireccion VARCHAR(50) NOT NULL,
    vch_clietelefono VARCHAR(20) NULL,
    vch_clieemail VARCHAR(50) NULL,
    vch_clieusuario VARCHAR(15) NOT NULL,
    vch_clieclave VARCHAR(15) NOT NULL,
    CONSTRAINT PK_Cliente PRIMARY KEY (int_cliecodigo),
    CONSTRAINT U_Cliente_chr_cliedni UNIQUE (chr_cliedni),
    CONSTRAINT U_Cliente_vch_clieusuario UNIQUE (vch_clieusuario)
);
GO

-- =============================================
-- TABLA Moneda
-- =============================================
CREATE TABLE Moneda (
    chr_monecodigo VARCHAR(2) NOT NULL,
    vch_monedescripcion VARCHAR(20) NOT NULL,
    CONSTRAINT PK_Moneda PRIMARY KEY (chr_monecodigo)
);
GO

-- =============================================
-- TABLA Negocio
-- =============================================
CREATE TABLE Negocio (
    int_negocodigo INT NOT NULL IDENTITY(2000,1),
    vch_negonombre VARCHAR(50) NOT NULL,
    chr_negnit VARCHAR(11) NOT NULL,
    vch_negociudad VARCHAR(30) NOT NULL,
    vch_negodireccion VARCHAR(50) NOT NULL,
    vch_negotelefono VARCHAR(20) NULL,
    vch_negoemail VARCHAR(50) NULL,
    vch_negusuario VARCHAR(15) NOT NULL,
    vch_negclave VARCHAR(15) NOT NULL,
    CONSTRAINT PK_Negocio PRIMARY KEY (int_negocodigo),
    CONSTRAINT U_Negocio_chr_negnit UNIQUE (chr_negnit),
    CONSTRAINT U_Negocio_vch_negusuario UNIQUE(vch_negusuario)
);
GO

-- =============================================
-- TABLA Cuenta
-- =============================================
CREATE TABLE Cuenta (
    int_cuencodigo INT NOT NULL IDENTITY(210101,1),
    chr_monecodigo VARCHAR(2) NOT NULL,
    chr_sucucodigo VARCHAR(3) NOT NULL,
    int_emplcreacuenta INT NOT NULL,
    int_cliecodigo INT NULL,
    int_negocodigo INT NULL,
    dec_cuensaldo DECIMAL(18, 2) NOT NULL,
    dtt_cuenfechacreacion DATETIME NOT NULL,
    vch_cuenestado VARCHAR(15) NOT NULL DEFAULT 'ACTIVO',
    int_cuencontmov INT NOT NULL,
    chr_cuenclave VARCHAR(6) NOT NULL,
    CONSTRAINT PK_Cuenta PRIMARY KEY (int_cuencodigo),
    CONSTRAINT FK_Cuenta_Moneda FOREIGN KEY (chr_monecodigo) REFERENCES Moneda(chr_monecodigo),
    CONSTRAINT FK_Cuenta_Sucursal FOREIGN KEY (chr_sucucodigo) REFERENCES Sucursal(chr_sucucodigo),
    CONSTRAINT FK_Cuenta_Empleado FOREIGN KEY (int_emplcreacuenta) REFERENCES Empleado(int_emplcodigo),
    CONSTRAINT FK_Cuenta_Cliente FOREIGN KEY (int_cliecodigo) REFERENCES Cliente(int_cliecodigo),
    CONSTRAINT FK_Cuenta_Negocio FOREIGN KEY (int_negocodigo) REFERENCES Negocio(int_negocodigo),
    CONSTRAINT CHK_Cuenta_Estado CHECK (vch_cuenestado IN ('ACTIVO', 'ANULADO', 'CANCELADO'))
);
GO

-- =============================================
-- TABLA Movimiento
-- =============================================
CREATE TABLE Movimiento (
    int_cuencodigo INT NOT NULL,
    int_movinumero INT NOT NULL,
    dtt_movifecha DATETIME NOT NULL,
    int_emplcodigo INT NOT NULL,
    int_tipocodigo INT NOT NULL,
    dec_moviimporte DECIMAL(18, 2) NOT NULL,
    int_cuenreferencia INT NULL,
    vch_movitransaccionid VARCHAR(20) NULL,
    CONSTRAINT PK_Movimiento PRIMARY KEY (int_cuencodigo, int_movinumero),
    CONSTRAINT FK_Movimiento_Cuenta FOREIGN KEY (int_cuencodigo) REFERENCES Cuenta(int_cuencodigo),
    CONSTRAINT FK_Movimiento_Empleado FOREIGN KEY (int_emplcodigo) REFERENCES Empleado(int_emplcodigo),
    CONSTRAINT FK_Movimiento_TipoMovimiento FOREIGN KEY (int_tipocodigo) REFERENCES TipoMovimiento(int_tipocodigo),
    CONSTRAINT CHK_Movimiento_Importe CHECK (dec_moviimporte >= 0)
);
GO

-- =============================================
-- TABLA Parametro
-- =============================================
CREATE TABLE Parametro (
    chr_paracodigo VARCHAR(3) NOT NULL,
    vch_paradescripcion VARCHAR(50) NOT NULL,
    vch_paravalor VARCHAR(70) NOT NULL,
    vch_paraestado VARCHAR(15) NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT PK_Parametro PRIMARY KEY (chr_paracodigo),
    CONSTRAINT CHK_Parametro_Estado CHECK (vch_paraestado IN ('ACTIVO', 'ANULADO', 'CANCELADO'))
);
GO

-- =============================================
-- TABLA CostoMovimiento
-- =============================================
CREATE TABLE CostoMovimiento (
    chr_monecodigo VARCHAR(2) NOT NULL,
    dec_costimporte DECIMAL(18, 2) NOT NULL,
    CONSTRAINT PK_CostoMovimiento PRIMARY KEY (chr_monecodigo),
    CONSTRAINT FK_CostoMovimiento_Moneda FOREIGN KEY (chr_monecodigo) REFERENCES Moneda(chr_monecodigo)
);
GO

-- =============================================
-- TABLA CargoMantenimiento
-- =============================================
CREATE TABLE CargoMantenimiento (
    chr_monecodigo VARCHAR(2) NOT NULL,
    dec_cargMontoMaximo DECIMAL(18, 2) NOT NULL,
    dec_cargImporte DECIMAL(18, 2) NOT NULL,
    CONSTRAINT PK_CargoMantenimiento PRIMARY KEY (chr_monecodigo),
    CONSTRAINT FK_CargoMantenimiento_Moneda FOREIGN KEY (chr_monecodigo) REFERENCES Moneda(chr_monecodigo)
);
GO

-- =============================================
-- TABLA Contador
-- =============================================
CREATE TABLE Contador (
    vch_conttabla VARCHAR(30) NOT NULL,
    int_contitem INT NOT NULL,
    int_contlongitud INT NOT NULL,
    CONSTRAINT PK_Contador PRIMARY KEY (vch_conttabla)
);
GO

-- =============================================
-- TABLA Tarjeta
-- =============================================
CREATE TABLE Tarjeta (
    chr_tarjcodigo VARCHAR(16) NOT NULL,
    int_cuencodigo INT NOT NULL,
    chr_tarjcvv VARCHAR(3) NOT NULL,
    dtt_tarjfechavencimiento DATETIME NOT NULL,
    vch_tarjestado VARCHAR(15) NOT NULL DEFAULT 'ACTIVO',
    vch_tarjetipo VARCHAR(10) NOT NULL DEFAULT 'DEBITO',
    CONSTRAINT PK_Tarjeta PRIMARY KEY (chr_tarjcodigo),
    CONSTRAINT FK_Tarjeta_Cuenta FOREIGN KEY (int_cuencodigo) REFERENCES Cuenta(int_cuencodigo),
    CONSTRAINT CHK_Tarjeta_Tipo CHECK (vch_tarjetipo IN ('DEBITO', 'CREDITO')),
    CONSTRAINT CHK_Tarjeta_Estado CHECK (vch_tarjestado IN ('ACTIVO', 'INACTIVO', 'ROBADO', 'PERDIDO'))
);
GO

CREATE TABLE PagoExterno (
    int_pagoid INT IDENTITY PRIMARY KEY,
    int_negocodigo INT NOT NULL,
    dec_pagoimporte DECIMAL(18,2) NOT NULL,
    vch_metodopago VARCHAR(20) NOT NULL,
    vch_referencia VARCHAR(30) NULL,
    dtt_pagofecha DATETIME NOT NULL DEFAULT GETDATE(),
    vch_pagoestado VARCHAR(15) NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT FK_PagoExterno_Negocio FOREIGN KEY (int_negocodigo) REFERENCES Negocio(int_negocodigo),
    CONSTRAINT CHK_PagoExterno_Estado CHECK (vch_pagoestado IN ('PENDIENTE','APROBADO','RECHAZADO'))
);
GO


CREATE TABLE Auditoria (
    int_auditid INT IDENTITY PRIMARY KEY,
    vch_accion VARCHAR(50) NOT NULL, INSERTAR, ACTUALIZAR, ELIMINAR
    vch_usuario VARCHAR(20) NOT NULL,
    dtt_fechahora DATETIME NOT NULL DEFAULT GETDATE(),
    vch_detalle VARCHAR(200) NULL
);
GO 

use Banco
-- Crear la tabla TransaccionPasarela
CREATE TABLE TransaccionPasarela (
    -- 1. Identificador de la Transaccin (Clave Primaria)
    int_transaccionid INT PRIMARY KEY IDENTITY(100000, 1), -- Inicia en 100000 para ser fcilmente distinguible
    
    -- 2. Detalles de la Transaccin
    vch_merchantid VARCHAR(50) NOT NULL,
    dec_monto DECIMAL(18, 2) NOT NULL,
    vch_moneda VARCHAR(3) NOT NULL DEFAULT 'gtq', -- Moneda de la transaccin
    
    -- 3. Tiempos
    dtt_fechahora DATETIME NOT NULL DEFAULT GETDATE(), -- Fecha de registro inicial
    dtt_fechaactualizacion DATETIME NULL,               -- Fecha de ltima actualizacin (ej: al recibir respuesta del banco)

    -- 4. Datos Sensibles / Auditora
    vch_tarjetaultimos4 VARCHAR(4) NOT NULL, -- Los ltimos 4 dgitos de la tarjeta
    
    -- 5. Estado y Mensajes
    vch_estado VARCHAR(20) NOT NULL,         -- PENDIENTE, APROBADO, RECHAZADO, FALLIDO
    vch_mensaje VARCHAR(200) NULL,           -- Mensaje resumido para el cliente (ej: "Transaccin exitosa")
    vch_mensaje_banco VARCHAR(250) NULL,     -- Mensaje literal del banco (ms detallado)
    
    -- 6. Referencia al Banco
    int_cuentareferencia INT NULL             -- ID de referencia devuelto por el Banco Ficticio
);
GO


-- =============================================
-- TABLA OrdenPago - Para órdenes de pago de negocios
-- =============================================
use Banco
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