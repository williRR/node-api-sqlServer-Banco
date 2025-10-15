-- =============================================
-- Seleccionar la base de datos
-- =============================================
USE Banco;
GO

-- =============================================
-- Cargar Datos de Prueba
-- =============================================

-- Tabla: Moneda
INSERT INTO Moneda (chr_monecodigo, vch_monedescripcion) VALUES ('01', 'Quetzales');
INSERT INTO Moneda (chr_monecodigo, vch_monedescripcion) VALUES ('02', 'Dolares');
GO

-- Tabla: CargoMantenimiento
INSERT INTO CargoMantenimiento (chr_monecodigo, dec_cargMontoMaximo, dec_cargImporte) VALUES ('01', 3500.00, 15.00);
INSERT INTO CargoMantenimiento (chr_monecodigo, dec_cargMontoMaximo, dec_cargImporte) VALUES ('02', 1200.00, 2.50);
GO

-- Tabla: CostoMovimiento
INSERT INTO CostoMovimiento (chr_monecodigo, dec_costimporte) VALUES ('01', 5.00);
INSERT INTO CostoMovimiento (chr_monecodigo, dec_costimporte) VALUES ('02', 1.00);
GO

-- Tabla: TipoMovimiento (int_tipocodigo is IDENTITY)
INSERT INTO TipoMovimiento (vch_tipodescripcion, vch_tipoaccion, vch_tipoestado) VALUES ('Apertura de Cuenta', 'INGRESO', 'ACTIVO');
INSERT INTO TipoMovimiento (vch_tipodescripcion, vch_tipoaccion, vch_tipoestado) VALUES ('Cancelar Cuenta', 'SALIDA', 'ACTIVO');
INSERT INTO TipoMovimiento (vch_tipodescripcion, vch_tipoaccion, vch_tipoestado) VALUES ('Deposito', 'INGRESO', 'ACTIVO');
INSERT INTO TipoMovimiento (vch_tipodescripcion, vch_tipoaccion, vch_tipoestado) VALUES ('Retiro', 'SALIDA', 'ACTIVO');
INSERT INTO TipoMovimiento (vch_tipodescripcion, vch_tipoaccion, vch_tipoestado) VALUES ('Interes', 'INGRESO', 'ACTIVO');
INSERT INTO TipoMovimiento (vch_tipodescripcion, vch_tipoaccion, vch_tipoestado) VALUES ('Mantenimiento', 'SALIDA', 'ACTIVO');
INSERT INTO TipoMovimiento (vch_tipodescripcion, vch_tipoaccion, vch_tipoestado) VALUES ('Transferencia', 'INGRESO', 'ACTIVO');
INSERT INTO TipoMovimiento (vch_tipodescripcion, vch_tipoaccion, vch_tipoestado) VALUES ('Transferencia', 'SALIDA', 'ACTIVO');
INSERT INTO TipoMovimiento (vch_tipodescripcion, vch_tipoaccion, vch_tipoestado) VALUES ('Cargo por Movimiento', 'SALIDA', 'ACTIVO');
GO

-- Tabla: Sucursal
INSERT INTO Sucursal (chr_sucucodigo, vch_sucunombre, vch_sucuciudad, vch_sucudireccion, int_sucucontcuenta) VALUES ('001', 'Quetzal', 'Guatemala', 'Avenida Reforma 1-20, Zona 9', 2);
INSERT INTO Sucursal (chr_sucucodigo, vch_sucunombre, vch_sucuciudad, vch_sucudireccion, int_sucucontcuenta) VALUES ('002', 'Tikal', 'Petén', 'Calle Principal, Flores', 3);
INSERT INTO Sucursal (chr_sucucodigo, vch_sucunombre, vch_sucuciudad, vch_sucudireccion, int_sucucontcuenta) VALUES ('003', 'Antigua', 'Sacatepéquez', '3a Avenida Norte, Antigua Guatemala', 1);
INSERT INTO Sucursal (chr_sucucodigo, vch_sucunombre, vch_sucuciudad, vch_sucudireccion, int_sucucontcuenta) VALUES ('004', 'Xela', 'Quetzaltenango', '4a Calle, Zona 1', 0);
INSERT INTO Sucursal (chr_sucucodigo, vch_sucunombre, vch_sucuciudad, vch_sucudireccion, int_sucucontcuenta) VALUES ('005', 'Lago', 'Sololá', 'Calle Santander, Panajachel', 0);
INSERT INTO Sucursal (chr_sucucodigo, vch_sucunombre, vch_sucuciudad, vch_sucudireccion, int_sucucontcuenta) VALUES ('006', 'Esmeralda', 'Izabal', 'Barrio El Estor', 0);
INSERT INTO Sucursal (chr_sucucodigo, vch_sucunombre, vch_sucuciudad, vch_sucudireccion, int_sucucontcuenta) VALUES ('007', 'Volcán', 'Escuintla', 'Avenida Centroamérica, Escuintla', 0);
GO

-- Tabla: Empleado (int_emplcodigo is IDENTITY)
INSERT INTO Empleado (vch_empldni, vch_emplpaterno, vch_emplmaterno, vch_emplnombre, vch_emplciudad, chr_emplgenero, vch_empldireccion, vch_emplusuario, vch_emplclave) VALUES ('10145693', 'Romero', 'Castillo', 'Carlos Alberto', 'Petén', 'M', 'Call1 1 Nro. 456', 'cromero', 'chicho');
INSERT INTO Empleado (vch_empldni, vch_emplpaterno, vch_emplmaterno, vch_emplnombre, vch_emplciudad, chr_emplgenero, vch_empldireccion, vch_emplusuario, vch_emplclave) VALUES ('10773456', 'Castro', 'Vargas', 'Lidia', 'Guatemala', 'F', 'Federico Villarreal 456 - SMP', 'lcastro', 'flaca');
INSERT INTO Empleado (vch_empldni, vch_emplpaterno, vch_emplmaterno, vch_emplnombre, vch_emplciudad, chr_emplgenero, vch_empldireccion, vch_emplusuario, vch_emplclave) VALUES ('10679245', 'Reyes', 'Ortiz', 'Claudia', 'Guatemala', 'F', 'Av. Aviación 3456 - San Borja', 'creyes', 'linda');
INSERT INTO Empleado (vch_empldni, vch_emplpaterno, vch_emplmaterno, vch_emplnombre, vch_emplciudad, chr_emplgenero, vch_empldireccion, vch_emplusuario, vch_emplclave) VALUES ('10238943', 'Ramos', 'Garibay', 'Angelica', 'Guatemala', 'F', 'Calle Barcelona 345', 'aramos', 'china');
INSERT INTO Empleado (vch_empldni, vch_emplpaterno, vch_emplmaterno, vch_emplnombre, vch_emplciudad, chr_emplgenero, vch_empldireccion, vch_emplusuario, vch_emplclave) VALUES ('10773345', 'Ruiz', 'Zabaleta', 'Claudia', 'Quetzaltenango', 'F', 'Calle Cruz Verde 364', 'cvalencia', 'angel');
INSERT INTO Empleado (vch_empldni, vch_emplpaterno, vch_emplmaterno, vch_emplnombre, vch_emplciudad, chr_emplgenero, vch_empldireccion, vch_emplusuario, vch_emplclave) VALUES ('10889900', 'Cruz', 'Tarazona', 'Ricardo', 'Izabal', 'M', 'Calle La Gruta 304', 'rcruz', 'cerebro');
INSERT INTO Empleado (vch_empldni, vch_emplpaterno, vch_emplmaterno, vch_emplnombre, vch_emplciudad, chr_emplgenero, vch_empldireccion, vch_emplusuario, vch_emplclave) VALUES ('10998877', 'Diaz', 'Flores', 'Edith', 'Guatemala', 'F', 'Av. Pardo 546', 'ediaz', 'princesa');
INSERT INTO Empleado (vch_empldni, vch_emplpaterno, vch_emplmaterno, vch_emplnombre, vch_emplciudad, chr_emplgenero, vch_empldireccion, vch_emplusuario, vch_emplclave) VALUES ('10112233', 'Sarmiento', 'Bellido', 'Claudia Rocio', 'Izabal', 'F', 'Calle Alfonso Ugarte 1567', 'csarmiento', 'chinita');
INSERT INTO Empleado (vch_empldni, vch_emplpaterno, vch_emplmaterno, vch_emplnombre, vch_emplciudad, chr_emplgenero, vch_empldireccion, vch_emplusuario, vch_emplclave) VALUES ('10445566', 'Pachas', 'Sifuentes', 'Luis Alberto', 'Petén', 'M', 'Francisco Pizarro 1263', 'lpachas', 'gato');
INSERT INTO Empleado (vch_empldni, vch_emplpaterno, vch_emplmaterno, vch_emplnombre, vch_emplciudad, chr_emplgenero, vch_empldireccion, vch_emplusuario, vch_emplclave) VALUES ('10778899', 'Tello', 'Alarcon', 'Hugo Valentin', 'Quetzaltenango', 'M', 'Los Angeles 865', 'htello', 'machupichu');
INSERT INTO Empleado (vch_empldni, vch_emplpaterno, vch_emplmaterno, vch_emplnombre, vch_emplciudad, chr_emplgenero, vch_empldireccion, vch_emplusuario, vch_emplclave) VALUES ('10332211', 'Carrasco', 'Vargas', 'Pedro Hugo', 'Guatemala', 'M', 'Av. Balta 1265', 'pcarrasco', 'tinajones');
GO

-- Tabla: Asignado (int_asigcodigo is IDENTITY)
INSERT INTO Asignado (chr_sucucodigo, int_emplcodigo, dtt_asigfechaalta, dtt_asigfechabaja) VALUES ('001', 103, '20071115', NULL);
INSERT INTO Asignado (chr_sucucodigo, int_emplcodigo, dtt_asigfechaalta, dtt_asigfechabaja) VALUES ('002', 100, '20071120', NULL);
INSERT INTO Asignado (chr_sucucodigo, int_emplcodigo, dtt_asigfechaalta, dtt_asigfechabaja) VALUES ('003', 101, '20071128', NULL);
INSERT INTO Asignado (chr_sucucodigo, int_emplcodigo, dtt_asigfechaalta, dtt_asigfechabaja) VALUES ('004', 102, '20071212', '20080325');
INSERT INTO Asignado (chr_sucucodigo, int_emplcodigo, dtt_asigfechaalta, dtt_asigfechabaja) VALUES ('005', 105, '20071220', NULL);
INSERT INTO Asignado (chr_sucucodigo, int_emplcodigo, dtt_asigfechaalta, dtt_asigfechabaja) VALUES ('006', 104, '20080105', '20090415');
INSERT INTO Asignado (chr_sucucodigo, int_emplcodigo, dtt_asigfechaalta, dtt_asigfechabaja) VALUES ('004', 106, '20080107', NULL);
INSERT INTO Asignado (chr_sucucodigo, int_emplcodigo, dtt_asigfechaalta, dtt_asigfechabaja) VALUES ('005', 107, '20080107', NULL);
INSERT INTO Asignado (chr_sucucodigo, int_emplcodigo, dtt_asigfechaalta, dtt_asigfechabaja) VALUES ('001', 110, '20080108', NULL);
INSERT INTO Asignado (chr_sucucodigo, int_emplcodigo, dtt_asigfechaalta, dtt_asigfechabaja) VALUES ('002', 108, '20080108', NULL);
INSERT INTO Asignado (chr_sucucodigo, int_emplcodigo, dtt_asigfechaalta, dtt_asigfechabaja) VALUES ('006', 109, '20080108', NULL);
INSERT INTO Asignado (chr_sucucodigo, int_emplcodigo, dtt_asigfechaalta, dtt_asigfechabaja) VALUES ('004', 104, '20090416', NULL);
GO

-- Tabla: Parametro
INSERT INTO Parametro (chr_paracodigo, vch_paradescripcion, vch_paravalor, vch_paraestado) VALUES ('002', 'Número de Operaciones Sin Costo', '10', 'ACTIVO');
GO

-- Tabla: Cliente (int_cliecodigo is IDENTITY)
INSERT INTO Cliente (vch_cliepaterno, vch_cliematerno, vch_clienombre, chr_cliedni, dtt_clienacimiento, vch_clieciudad, vch_cliedireccion, vch_clietelefono, vch_clieemail, vch_clieusuario, vch_clieclave) VALUES ('GARCIA', 'PEREZ', 'MARIA', '10145693', '19800515', 'Guatemala', 'Zona 1, 1-20', '555-1234', 'mgarcia@banco.com', 'mgarcia', 'password123');
INSERT INTO Cliente (vch_cliepaterno, vch_cliematerno, vch_clienombre, chr_cliedni, dtt_clienacimiento, vch_clieciudad, vch_cliedireccion, vch_clietelefono, vch_clieemail, vch_clieusuario, vch_clieclave) VALUES ('LOPEZ', 'DIAZ', 'JUAN', '10773456', '19900822', 'Quetzaltenango', 'Zona 3, 5-30', '555-5678', 'jlopez@banco.com', 'jlopez', 'pass456');
INSERT INTO Cliente (vch_cliepaterno, vch_cliematerno, vch_clienombre, chr_cliedni, dtt_clienacimiento, vch_clieciudad, vch_cliedireccion, vch_clietelefono, vch_clieemail, vch_clieusuario, vch_clieclave) VALUES ('RODRIGUEZ', 'MARTINEZ', 'ANA', '10679245', '19751101', 'Guatemala', 'Zona 10, 2-15', '555-9012', 'arodriguez@banco.com', 'arodriguez', 'pass789');
INSERT INTO Cliente (vch_cliepaterno, vch_cliematerno, vch_clienombre, chr_cliedni, dtt_clienacimiento, vch_clieciudad, vch_cliedireccion, vch_clietelefono, vch_clieemail, vch_clieusuario, vch_clieclave) VALUES ('GONZALEZ', 'HERNANDEZ', 'PEDRO', '10238943', '19950310', 'Antigua', 'Calle Ancha, 3-45', '555-3456', 'pgonzalez@banco.com', 'pgonzalez', 'pass101');
INSERT INTO Cliente (vch_cliepaterno, vch_cliematerno, vch_clienombre, chr_cliedni, dtt_clienacimiento, vch_clieciudad, vch_cliedireccion, vch_clietelefono, vch_clieemail, vch_clieusuario, vch_clieclave) VALUES ('PEREZ', 'SANCHEZ', 'SOFIA', '10773345', '20000725', 'Guatemala', 'Zona 14, 8-90', '555-7890', 'sperez@banco.com', 'sperez', 'pass123');
GO

-- Tabla: Negocio (int_negocodigo is IDENTITY)
INSERT INTO Negocio (vch_negonombre, chr_negnit, vch_negociudad, vch_negodireccion, vch_negotelefono, vch_negoemail, vch_negusuario, vch_negclave) VALUES ('Tienda El Quetzal', '12345678912', 'Guatemala', 'Avenida Las Américas 1-15', '2456-7890', 'info@quetzal.com', 'elquetzal', 'negocio123');
INSERT INTO Negocio (vch_negonombre, chr_negnit, vch_negociudad, vch_negodireccion, vch_negotelefono, vch_negoemail, vch_negusuario, vch_negclave) VALUES ('Restaurante Tikal', '98765432109', 'Petén', 'Calle de los Arcos, 10', '7890-1234', 'info@tikal.com', 'tikal', 'negocio456');
INSERT INTO Negocio (vch_negonombre, chr_negnit, vch_negociudad, vch_negodireccion, vch_negotelefono, vch_negoemail, vch_negusuario, vch_negclave) VALUES ('Tecnología Avanzada', '56789012345', 'Quetzaltenango', '4ta Avenida, 2-30', '7765-4321', 'contacto@tecnoavanzada.com', 'tecnoavanzada', 'negocio789');
GO
select * from Negocio

-- Tabla: Cuenta (int_cuencodigo is manually inserted, NOT IDENTITY)
INSERT INTO Cuenta (int_cuencodigo, chr_monecodigo, chr_sucucodigo, int_emplcreacuenta, int_cliecodigo, int_negocodigo, dec_cuensaldo, dtt_cuenfechacreacion, vch_cuenestado, int_cuencontmov, chr_cuenclave) VALUES (200001, '01', '002', 100, 100, NULL, 7000.00, '20220105', 'ACTIVO', 15, '123456');
INSERT INTO Cuenta (int_cuencodigo, chr_monecodigo, chr_sucucodigo, int_emplcreacuenta, int_cliecodigo, int_negocodigo, dec_cuensaldo, dtt_cuenfechacreacion, vch_cuenestado, int_cuencontmov, chr_cuenclave) VALUES (200002, '01', '002', 100, 101, NULL, 6800.00, '20220109', 'ACTIVO', 3, '123456');
INSERT INTO Cuenta (int_cuencodigo, chr_monecodigo, chr_sucucodigo, int_emplcreacuenta, int_cliecodigo, int_negocodigo, dec_cuensaldo, dtt_cuenfechacreacion, vch_cuenestado, int_cuencontmov, chr_cuenclave) VALUES (200003, '02', '002', 100, 102, NULL, 6000.00, '20220111', 'ACTIVO', 6, '123456');
INSERT INTO Cuenta (int_cuencodigo, chr_monecodigo, chr_sucucodigo, int_emplcreacuenta, int_cliecodigo, int_negocodigo, dec_cuensaldo, dtt_cuenfechacreacion, vch_cuenestado, int_cuencontmov, chr_cuenclave) VALUES (100001, '01', '001', 103, 103, NULL, 6900.00, '20220106', 'ACTIVO', 7, '123456');
INSERT INTO Cuenta (int_cuencodigo, chr_monecodigo, chr_sucucodigo, int_emplcreacuenta, int_cliecodigo, int_negocodigo, dec_cuensaldo, dtt_cuenfechacreacion, vch_cuenestado, int_cuencontmov, chr_cuenclave) VALUES (100002, '02', '001', 103, 104, NULL, 4500.00, '20220108', 'ACTIVO', 4, '123456');
INSERT INTO Cuenta (int_cuencodigo, chr_monecodigo, chr_sucucodigo, int_emplcreacuenta, int_cliecodigo, int_negocodigo, dec_cuensaldo, dtt_cuenfechacreacion, vch_cuenestado, int_cuencontmov, chr_cuenclave) VALUES (300001, '01', '003', 101, 100, NULL, 0.00, '20220107', 'CANCELADO', 3, '123456');
INSERT INTO Cuenta (int_cuencodigo, chr_monecodigo, chr_sucucodigo, int_emplcreacuenta, int_cliecodigo, int_negocodigo, dec_cuensaldo, dtt_cuenfechacreacion, vch_cuenestado, int_cuencontmov, chr_cuenclave) VALUES (300002, '01', '003', 101, NULL, 2000, 15000.00, '20220510', 'ACTIVO', 5, '789012');
INSERT INTO Cuenta (int_cuencodigo, chr_monecodigo, chr_sucucodigo, int_emplcreacuenta, int_cliecodigo, int_negocodigo, dec_cuensaldo, dtt_cuenfechacreacion, vch_cuenestado, int_cuencontmov, chr_cuenclave) VALUES (400001, '02', '004', 102, NULL, 2001, 2500.00, '20220620', 'ACTIVO', 2, '345678');
GO

-- Tabla: Movimiento
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (100002, 1, '20220108', 103, 1, 1800.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (100002, 2, '20220125', 103, 4, 1000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (100002, 3, '20220213', 103, 3, 2200.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (100002, 4, '20220308', 103, 3, 1500.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (100001, 1, '20220106', 103, 1, 2800.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (100001, 2, '20220115', 103, 3, 3200.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (100001, 3, '20220120', 103, 4, 800.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (100001, 4, '20220214', 103, 3, 2000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (100001, 5, '20220225', 103, 4, 500.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (100001, 6, '20220303', 103, 4, 800.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (100001, 7, '20220315', 103, 3, 1000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200003, 1, '20220111', 100, 1, 2500.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200003, 2, '20220117', 100, 3, 1500.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200003, 3, '20220120', 100, 4, 500.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200003, 4, '20220209', 100, 4, 500.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200003, 5, '20220225', 100, 3, 3500.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200003, 6, '20220311', 100, 4, 500.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200002, 1, '20220109', 100, 1, 3800.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200002, 2, '20220120', 100, 3, 4200.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200002, 3, '20220306', 100, 4, 1200.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200001, 1, '20220105', 100, 1, 5000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200001, 2, '20220107', 100, 3, 4000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200001, 3, '20220109', 100, 4, 2000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200001, 4, '20220111', 100, 3, 1000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200001, 5, '20220113', 100, 3, 2000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200001, 6, '20220115', 100, 4, 4000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200001, 7, '20220119', 100, 3, 2000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200001, 8, '20220121', 100, 4, 3000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200001, 9, '20220123', 100, 3, 7000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200001, 10, '20220127', 100, 4, 1000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200001, 11, '20220130', 100, 4, 3000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200001, 12, '20220204', 100, 3, 2000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200001, 13, '20220208', 100, 4, 4000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200001, 14, '20220213', 100, 3, 2000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (200001, 15, '20220219', 100, 4, 1000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (300001, 1, '20220107', 101, 1, 5600.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (300001, 2, '20220118', 101, 3, 1400.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (300001, 3, '20220125', 101, 2, 7000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (300002, 1, '20220510', 101, 1, 15000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (300002, 2, '20220601', 101, 4, 5000.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (400001, 1, '20220620', 102, 1, 2500.00, NULL, NULL);
INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid) VALUES (400001, 2, '20220710', 102, 3, 500.00, NULL, NULL);
GO

-- Tabla: Contador
INSERT INTO Contador (vch_conttabla, int_contitem, int_contlongitud) VALUES ('Moneda', 2, 2);
INSERT INTO Contador (vch_conttabla, int_contitem, int_contlongitud) VALUES ('TipoMovimiento', 10, 3);
INSERT INTO Contador (vch_conttabla, int_contitem, int_contlongitud) VALUES ('Sucursal', 7, 3);
INSERT INTO Contador (vch_conttabla, int_contitem, int_contlongitud) VALUES ('Empleado', 11, 4);
INSERT INTO Contador (vch_conttabla, int_contitem, int_contlongitud) VALUES ('Asignado', 12, 6);
INSERT INTO Contador (vch_conttabla, int_contitem, int_contlongitud) VALUES ('Parametro', 2, 3);
INSERT INTO Contador (vch_conttabla, int_contitem, int_contlongitud) VALUES ('Cliente', 20, 5);
GO

-- Tabla: Tarjeta
INSERT INTO Tarjeta (chr_tarjcodigo, int_cuencodigo, chr_tarjcvv, dtt_tarjfechavencimiento, vch_tarjestado, vch_tarjetipo) VALUES ('1234567890123456', 200001, '123', '20251231', 'ACTIVO', 'DEBITO');
INSERT INTO Tarjeta (chr_tarjcodigo, int_cuencodigo, chr_tarjcvv, dtt_tarjfechavencimiento, vch_tarjestado, vch_tarjetipo) VALUES ('1111222233334444', 100002, '456', '20261030', 'ACTIVO', 'DEBITO');
INSERT INTO Tarjeta (chr_tarjcodigo, int_cuencodigo, chr_tarjcvv, dtt_tarjfechavencimiento, vch_tarjestado, vch_tarjetipo) VALUES ('5555666677778888', 300002, '789', '20270515', 'ACTIVO', 'CREDITO');
GO