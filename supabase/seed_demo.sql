-- =============================================================================
-- seed_demo.sql
-- Inserta 100 socios de prueba
-- Ejecuta después de 001_complete_schema.sql
-- =============================================================================

BEGIN;

-- Desactivar RLS temporalmente para insertar
ALTER TABLE members DISABLE ROW LEVEL SECURITY;

-- Limpiar datos previos
DELETE FROM members;

-- Insertar 100 socios
-- Distribución relativa a 2026-05-08:
--   Filas  1-17 → activos, recién pagados (May 1-8, vence Jun 1-8)
--   Filas 18-34 → activos con 12-22 días (paid Apr 20-30, vence May 20-30)
--   Filas 35-50 → vencen pronto 1-10 días / hoy (paid Apr 8-18, vence May 8-18)
--   Filas 51-65 → vencidos hace 1-30 días (paid Mar 8 - Apr 7, vence Abr 8 - May 7)
--   Filas 66-80 → vencidos ~2 meses (paid Ene 10 - Mar 5, vence Feb 10 - Abr 5)
--   Filas 81-100 → vencidos hace 3-8 meses (paid Sep 2025 - Ene 2026)
INSERT INTO members (full_name, phone, fee_amount, paid_at, expires_at, notes, created_at) VALUES
-- Grupo A: activos, pagaron esta semana (vence Jun)
('Carlos Martínez López',    '112345678', 30, '2026-05-01', '2026-06-01', NULL,       '2026-05-01 09:00:00+00'),
('Laura Sánchez García',     '123456789', 35, '2026-05-02', '2026-06-02', 'Clase',    '2026-05-02 10:00:00+00'),
('Miguel Fernández Ruiz',    '134567890', 30, '2026-05-03', '2026-06-03', NULL,       '2026-05-03 11:00:00+00'),
('Ana González Pérez',       '145678901', 35, '2026-05-04', '2026-06-04', NULL,       '2026-05-04 08:30:00+00'),
('David López Martínez',     '156789012', 30, '2026-05-05', '2026-06-05', 'Renovó',   '2026-05-05 09:15:00+00'),
('Sara Jiménez Torres',      '167890123', 35, '2026-05-05', '2026-06-05', NULL,       '2026-05-05 10:30:00+00'),
('Pablo Romero Castro',      '178901234', 30, '2026-05-06', '2026-06-06', NULL,       '2026-05-06 11:45:00+00'),
('Isabel Moreno Díaz',       '189012345', 35, '2026-05-06', '2026-06-06', NULL,       '2026-05-06 08:00:00+00'),
('Alejandro Álvarez Ruiz',   '190123456', 30, '2026-05-07', '2026-06-07', NULL,       '2026-05-07 09:00:00+00'),
('Carmen Gutiérrez Vega',    '101234567', 35, '2026-05-07', '2026-06-07', NULL,       '2026-05-07 10:00:00+00'),
('Jorge Rodríguez Molina',   '112345679', 30, '2026-05-07', '2026-06-07', NULL,       '2026-05-07 11:00:00+00'),
('Marta Hernández Gil',      '123456780', 35, '2026-05-08', '2026-06-08', 'Bizum',    '2026-05-08 09:30:00+00'),
('Raúl Domínguez Navarro',   '134567891', 30, '2026-05-08', '2026-06-08', NULL,       '2026-05-08 10:15:00+00'),
('Elena Vázquez Serrano',    '145678902', 35, '2026-05-08', '2026-06-08', NULL,       '2026-05-08 08:45:00+00'),
('Sergio Blanco Ramos',      '156789013', 30, '2026-05-08', '2026-06-08', NULL,       '2026-05-08 09:00:00+00'),
('Lucía Ortega Fuentes',     '167890124', 35, '2026-05-02', '2026-06-02', NULL,       '2026-05-02 10:00:00+00'),
('Andrés Castillo Reyes',    '178901235', 30, '2026-05-03', '2026-06-03', NULL,       '2026-05-03 11:00:00+00'),
-- Grupo B: activos, vencen en 12-22 días (paid Apr 20-30)
('Patricia Rubio Iglesias',  NULL,        35, '2026-04-20', '2026-05-20', NULL,       '2026-04-20 08:00:00+00'),
('Fernando Medina Vargas',   '190123457', 30, '2026-04-21', '2026-05-21', NULL,       '2026-04-21 09:00:00+00'),
('Rosa Suárez Peña',         '101234568', 35, '2026-04-22', '2026-05-22', NULL,       '2026-04-22 10:00:00+00'),
('Javier Mora Herrero',      '112345680', 30, '2026-04-23', '2026-05-23', NULL,       '2026-04-23 11:00:00+00'),
('Natalia Cruz Gallego',     '123456781', 35, '2026-04-24', '2026-05-24', NULL,       '2026-04-24 09:30:00+00'),
('Alberto Reyes Cano',       NULL,        30, '2026-04-25', '2026-05-25', 'Mañana',   '2026-04-25 10:00:00+00'),
('Beatriz Lozano Campos',    '145678903', 35, '2026-04-26', '2026-05-26', NULL,       '2026-04-26 08:30:00+00'),
('Marcos Ferrer Soto',       '156789014', 30, '2026-04-27', '2026-05-27', NULL,       '2026-04-27 09:00:00+00'),
('Cristina Bravo Aguilar',   '167890125', 35, '2026-04-28', '2026-05-28', NULL,       '2026-04-28 10:00:00+00'),
('Víctor Pascual Ibáñez',    '178901236', 30, '2026-04-28', '2026-05-28', NULL,       '2026-04-28 11:00:00+00'),
('Silvia Calvo Pedraza',     '189012346', 35, '2026-04-29', '2026-05-29', NULL,       '2026-04-29 08:00:00+00'),
('Oscar Guerrero Benito',    '190123458', 30, '2026-04-29', '2026-05-29', NULL,       '2026-04-29 09:15:00+00'),
('Irene Cano Montero',       NULL,        35, '2026-04-30', '2026-05-30', NULL,       '2026-04-30 10:00:00+00'),
('Eduardo Pardo León',       '112345681', 30, '2026-04-30', '2026-05-30', NULL,       '2026-04-30 11:00:00+00'),
('Virginia Santos Aranda',   '123456782', 35, '2026-04-20', '2026-05-20', 'Pareja',   '2026-04-20 09:00:00+00'),
('Diego Nieto Cordero',      '134567892', 30, '2026-04-21', '2026-05-21', NULL,       '2026-04-21 10:00:00+00'),
('Amparo Delgado Marcos',    '145678904', 35, '2026-04-22', '2026-05-22', NULL,       '2026-04-22 08:30:00+00'),
-- Grupo C: vencen pronto (1-10 días) o hoy (paid Apr 8-18)
('Rubén Prieto Vidal',       '156789015', 30, '2026-04-09', '2026-05-09', NULL,       '2026-04-09 09:45:00+00'),
('Nuria Molina Esteban',     '167890126', 35, '2026-04-10', '2026-05-10', NULL,       '2026-04-10 10:00:00+00'),
('Gonzalo Ríos Carmona',     '178901237', 30, '2026-04-11', '2026-05-11', NULL,       '2026-04-11 11:00:00+00'),
('Teresa Marín Expósito',    '189012347', 35, '2026-04-12', '2026-05-12', NULL,       '2026-04-12 09:00:00+00'),
('Hugo Cabrera Montes',      NULL,        30, '2026-04-13', '2026-05-13', NULL,       '2026-04-13 10:30:00+00'),
('Verónica Iglesias Parra',  '101234569', 35, '2026-04-14', '2026-05-14', NULL,       '2026-04-14 08:00:00+00'),
('Manuel Fuentes Romero',    '112345682', 30, '2026-04-15', '2026-05-15', NULL,       '2026-04-15 09:00:00+00'),
('Elisa Crespo Jiménez',     '123456783', 35, '2026-04-16', '2026-05-16', NULL,       '2026-04-16 10:00:00+00'),
('Tomás Guerrero Sáez',      '134567893', 30, '2026-04-17', '2026-05-17', 'Nuevo',    '2026-04-17 08:30:00+00'),
('Lorena Vargas Blanco',     '145678905', 35, '2026-04-18', '2026-05-18', 'Nueva',    '2026-04-18 09:00:00+00'),
('Guillermo Ortiz Ponce',    '156789016', 30, '2026-04-09', '2026-05-09', NULL,       '2026-04-09 10:00:00+00'),
('Adriana Esteban Roca',     '167890127', 35, '2026-04-10', '2026-05-10', NULL,       '2026-04-10 11:00:00+00'),
('Enrique Herrera Duran',    '178901238', 30, '2026-04-11', '2026-05-11', NULL,       '2026-04-11 09:00:00+00'),
('Mónica Casado Bernal',     '189012348', 35, '2026-04-12', '2026-05-12', NULL,       '2026-04-12 10:00:00+00'),
('Roberto Peña Navarro',     NULL,        30, '2026-04-13', '2026-05-13', NULL,       '2026-04-13 11:00:00+00'),
('Susana Ibáñez Cortés',     '101234570', 35, '2026-04-08', '2026-05-08', NULL,       '2026-04-08 08:30:00+00'),
-- Grupo D: vencidos hace 1-30 días (paid Mar 8 - Apr 7)
('Joaquín Alonso Rubio',     '112345683', 30, '2026-04-07', '2026-05-07', NULL,       '2026-04-07 09:45:00+00'),
('Pilar Vega Medina',        '123456784', 35, '2026-04-05', '2026-05-05', NULL,       '2026-04-05 10:00:00+00'),
('Ángel Ramos Fuentes',      '134567894', 30, '2026-04-03', '2026-05-03', NULL,       '2026-04-03 11:00:00+00'),
('Gloria Mora Díaz',         '145678906', 35, '2026-04-01', '2026-05-01', NULL,       '2026-04-01 08:30:00+00'),
('Héctor Soler Pascual',     '156789017', 30, '2026-03-28', '2026-04-28', NULL,       '2026-03-28 09:00:00+00'),
('Rebeca Martos Correa',     '167890128', 35, '2026-03-25', '2026-04-25', NULL,       '2026-03-25 10:00:00+00'),
('Alfredo Parra Gallardo',   '178901239', 30, '2026-03-20', '2026-04-20', NULL,       '2026-03-20 11:00:00+00'),
('Consuelo Abad Serrano',    '189012349', 35, '2026-03-15', '2026-04-15', 'Avisada',  '2026-03-15 09:00:00+00'),
('Ismael Navas Bermejo',     '190123459', 30, '2026-03-12', '2026-04-12', NULL,       '2026-03-12 10:00:00+00'),
('Yolanda Carrasco Leal',    NULL,        35, '2026-03-10', '2026-04-10', NULL,       '2026-03-10 11:00:00+00'),
('Emilio Santana Moya',      '112345684', 30, '2026-03-08', '2026-04-08', NULL,       '2026-03-08 08:30:00+00'),
('Rocío Cabello Rivas',      '123456785', 35, '2026-04-06', '2026-05-06', NULL,       '2026-04-06 09:00:00+00'),
('Valentín Ojeda Hidalgo',   '134567895', 30, '2026-04-04', '2026-05-04', NULL,       '2026-04-04 10:00:00+00'),
('Dolores Trujillo Camacho', '145678907', 35, '2026-04-02', '2026-05-02', NULL,       '2026-04-02 11:00:00+00'),
('Nicolás Aragonés Vera',    '156789018', 30, '2026-03-30', '2026-04-30', 'Confirmar','2026-03-30 09:30:00+00'),
-- Grupo E: vencidos ~2 meses (paid Ene 10 - Mar 5)
('Manuela Exposito Rueda',   '167890129', 35, '2026-03-05', '2026-04-05', NULL,       '2026-03-05 10:00:00+00'),
('Francisco Mora Hervas',    '178901240', 30, '2026-02-28', '2026-03-28', NULL,       '2026-02-28 11:00:00+00'),
('Magdalena Polo Torrent',   '189012350', 35, '2026-02-20', '2026-03-20', NULL,       '2026-02-20 09:00:00+00'),
('Dionisio Campos Rioja',    NULL,        30, '2026-02-15', '2026-03-15', NULL,       '2026-02-15 10:00:00+00'),
('Encarnación Lara Peña',    '101234571', 35, '2026-02-10', '2026-03-10', NULL,       '2026-02-10 11:00:00+00'),
('Primitivo Saez Beltran',   '112345685', 30, '2026-02-05', '2026-03-05', NULL,       '2026-02-05 09:00:00+00'),
('Asunción Gil Montoya',     '123456786', 35, '2026-02-01', '2026-03-01', NULL,       '2026-02-01 10:00:00+00'),
('Celestino Bravo Macias',   '134567896', 30, '2026-01-25', '2026-02-25', NULL,       '2026-01-25 11:00:00+00'),
('Milagros Vidal Carrillo',  '145678908', 35, '2026-01-20', '2026-02-20', NULL,       '2026-01-20 08:30:00+00'),
('Serafín Muñoz Dávila',     '156789019', 30, '2026-01-15', '2026-02-15', NULL,       '2026-01-15 09:15:00+00'),
('Concepción Ríos Sevilla',  NULL,        35, '2026-01-10', '2026-02-10', NULL,       '2026-01-10 10:00:00+00'),
('Prudencio Serna Palomo',   '178901241', 30, '2026-02-25', '2026-03-25', NULL,       '2026-02-25 11:00:00+00'),
('Trinidad Rubiales Cano',   '189012351', 35, '2026-02-12', '2026-03-12', NULL,       '2026-02-12 09:00:00+00'),
('Saturnino Plaza Arce',     '190123460', 30, '2026-02-08', '2026-03-08', NULL,       '2026-02-08 10:00:00+00'),
('Remedios Ojeda Heredia',   '101234572', 35, '2026-02-03', '2026-03-03', NULL,       '2026-02-03 11:00:00+00'),
-- Grupo F: vencidos hace 3-8 meses (paid Sep 2025 - Ene 2026)
('Genaro Esteve Fuster',     '112345686', 30, '2026-01-05', '2026-02-05', NULL,       '2026-01-05 08:00:00+00'),
('Amalia Carbonell Mira',    '123456787', 35, '2026-01-01', '2026-02-01', 'Volvería', '2026-01-01 09:00:00+00'),
('Leoncio Pedrosa Vera',     NULL,        30, '2025-12-15', '2026-01-15', NULL,       '2025-12-15 10:00:00+00'),
('Rosario Cobo Almeida',     '145678909', 35, '2025-12-01', '2026-01-01', NULL,       '2025-12-01 11:00:00+00'),
('Narciso Quiles Pla',       '156789020', 30, '2025-11-15', '2025-12-15', NULL,       '2025-11-15 09:30:00+00'),
('Amparo Zamorano Ortiz',    '167890130', 35, '2025-11-01', '2025-12-01', NULL,       '2025-11-01 10:00:00+00'),
('Blas Marqués Cifuentes',   '178901242', 30, '2025-10-15', '2025-11-15', NULL,       '2025-10-15 11:00:00+00'),
('Josefa Montoya Alarcón',   '189012352', 35, '2025-10-01', '2025-11-01', NULL,       '2025-10-01 08:00:00+00'),
('Estanislao Vera Fajardo',  '190123461', 30, '2025-09-15', '2025-10-15', NULL,       '2025-09-15 09:00:00+00'),
('Felisa Poveda Soler',      NULL,        35, '2025-09-01', '2025-10-01', NULL,       '2025-09-01 10:00:00+00'),
('Atilano Tejada Muro',      '112345687', 30, '2025-12-20', '2026-01-20', NULL,       '2025-12-20 11:00:00+00'),
('Obdulia Chavarría Linares','123456788', 35, '2025-12-10', '2026-01-10', NULL,       '2025-12-10 09:00:00+00'),
('Fulgencio Moral Escudero', '134567897', 30, '2025-11-20', '2025-12-20', NULL,       '2025-11-20 10:00:00+00'),
('Hortensia Moya Salinas',   '199001001', 35, '2025-11-10', '2025-12-10', NULL,       '2025-11-10 11:00:00+00'),
('Nemesio Cuesta Arroyo',    '199001002', 30, '2025-10-20', '2025-11-20', NULL,       '2025-10-20 08:30:00+00'),
('Escolástica Vela Mata',    NULL,        35, '2025-10-10', '2025-11-10', NULL,       '2025-10-10 09:00:00+00'),
('Plácido Rincón Fuerte',    '199001004', 30, '2026-01-08', '2026-02-08', NULL,       '2026-01-08 10:00:00+00'),
('Evarista Mendez Sola',     '199001005', 35, '2025-12-08', '2026-01-08', NULL,       '2025-12-08 11:00:00+00'),
('Anselmo Leal Bautista',    '199001006', 30, '2025-11-08', '2025-12-08', NULL,       '2025-11-08 09:30:00+00'),
('Filomena Heras Costas',    '199001007', 35, '2025-10-08', '2025-11-08', NULL,       '2025-10-08 10:00:00+00');

-- Reactivar RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Backfill payments: un pago por cada socio (el pago actual conocido)
INSERT INTO payments (member_id, fee_amount, paid_at, expires_at)
SELECT id, fee_amount, paid_at, expires_at
FROM members;

-- Verificación final
SELECT 
  'Datos de prueba insertados ✅' as status,
  (SELECT COUNT(*) FROM members) as total_socios,
  COUNT(CASE WHEN expires_at < NOW()::date THEN 1 END) as vencidos,
  COUNT(CASE WHEN expires_at >= NOW()::date THEN 1 END) as activos,
  SUM(fee_amount) as ingresos_totales
FROM members;

SELECT
  'Payments insertados ✅' as status,
  COUNT(*) as total_payments
FROM payments;

COMMIT;
