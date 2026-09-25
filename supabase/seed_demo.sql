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
-- Distribución relativa a 2026-09-25 (fecha ancla; ajusta las fechas si ejecutas
-- este seed mucho después, regenerando con el mismo desfase relativo):
--   Filas  1-17 → activos, recién pagados (últimos 8 días, vencen dentro de 1 mes)
--   Filas 18-34 → activos con 12-22 días desde el pago
--   Filas 35-50 → vencen pronto 1-10 días / hoy
--   Filas 51-65 → vencidos hace 1-30 días
--   Filas 66-80 → vencidos ~2 meses
--   Filas 81-100 → vencidos hace 3-8 meses
INSERT INTO members (full_name, fee_amount, paid_at, expires_at, notes, created_at) VALUES
-- Grupo A: activos, pagaron esta semana
('Carlos Martínez López', 30, '2026-09-18', '2026-10-18', NULL, '2026-09-18 09:00:00+00'),
('Laura Sánchez García', 35, '2026-09-19', '2026-10-19', 'Clase', '2026-09-19 10:00:00+00'),
('Miguel Fernández Ruiz', 30, '2026-09-20', '2026-10-20', NULL, '2026-09-20 11:00:00+00'),
('Ana González Pérez', 35, '2026-09-21', '2026-10-21', NULL, '2026-09-21 08:30:00+00'),
('David López Martínez', 30, '2026-09-22', '2026-10-22', 'Renovó', '2026-09-22 09:15:00+00'),
('Sara Jiménez Torres', 35, '2026-09-22', '2026-10-22', NULL, '2026-09-22 10:30:00+00'),
('Pablo Romero Castro', 30, '2026-09-23', '2026-10-23', NULL, '2026-09-23 11:45:00+00'),
('Isabel Moreno Díaz', 35, '2026-09-23', '2026-10-23', NULL, '2026-09-23 08:00:00+00'),
('Alejandro Álvarez Ruiz', 30, '2026-09-24', '2026-10-24', NULL, '2026-09-24 09:00:00+00'),
('Carmen Gutiérrez Vega', 35, '2026-09-24', '2026-10-24', NULL, '2026-09-24 10:00:00+00'),
('Jorge Rodríguez Molina', 30, '2026-09-24', '2026-10-24', NULL, '2026-09-24 11:00:00+00'),
('Marta Hernández Gil', 35, '2026-09-25', '2026-10-25', 'Bizum', '2026-09-25 09:30:00+00'),
('Raúl Domínguez Navarro', 30, '2026-09-25', '2026-10-25', NULL, '2026-09-25 10:15:00+00'),
('Elena Vázquez Serrano', 35, '2026-09-25', '2026-10-25', NULL, '2026-09-25 08:45:00+00'),
('Sergio Blanco Ramos', 30, '2026-09-25', '2026-10-25', NULL, '2026-09-25 09:00:00+00'),
('Lucía Ortega Fuentes', 35, '2026-09-19', '2026-10-19', NULL, '2026-09-19 10:00:00+00'),
('Andrés Castillo Reyes', 30, '2026-09-20', '2026-10-20', NULL, '2026-09-20 11:00:00+00'),
-- Grupo B: activos, vencen en 12-22 días
('Patricia Rubio Iglesias', 35, '2026-09-07', '2026-10-07', NULL, '2026-09-07 08:00:00+00'),
('Fernando Medina Vargas', 30, '2026-09-08', '2026-10-08', NULL, '2026-09-08 09:00:00+00'),
('Rosa Suárez Peña', 35, '2026-09-09', '2026-10-09', NULL, '2026-09-09 10:00:00+00'),
('Javier Mora Herrero', 30, '2026-09-10', '2026-10-10', NULL, '2026-09-10 11:00:00+00'),
('Natalia Cruz Gallego', 35, '2026-09-11', '2026-10-11', NULL, '2026-09-11 09:30:00+00'),
('Alberto Reyes Cano', 30, '2026-09-12', '2026-10-12', 'Mañana', '2026-09-12 10:00:00+00'),
('Beatriz Lozano Campos', 35, '2026-09-13', '2026-10-13', NULL, '2026-09-13 08:30:00+00'),
('Marcos Ferrer Soto', 30, '2026-09-14', '2026-10-14', NULL, '2026-09-14 09:00:00+00'),
('Cristina Bravo Aguilar', 35, '2026-09-15', '2026-10-15', NULL, '2026-09-15 10:00:00+00'),
('Víctor Pascual Ibáñez', 30, '2026-09-15', '2026-10-15', NULL, '2026-09-15 11:00:00+00'),
('Silvia Calvo Pedraza', 35, '2026-09-16', '2026-10-16', NULL, '2026-09-16 08:00:00+00'),
('Oscar Guerrero Benito', 30, '2026-09-16', '2026-10-16', NULL, '2026-09-16 09:15:00+00'),
('Irene Cano Montero', 35, '2026-09-17', '2026-10-17', NULL, '2026-09-17 10:00:00+00'),
('Eduardo Pardo León', 30, '2026-09-17', '2026-10-17', NULL, '2026-09-17 11:00:00+00'),
('Virginia Santos Aranda', 35, '2026-09-07', '2026-10-07', 'Pareja', '2026-09-07 09:00:00+00'),
('Diego Nieto Cordero', 30, '2026-09-08', '2026-10-08', NULL, '2026-09-08 10:00:00+00'),
('Amparo Delgado Marcos', 35, '2026-09-09', '2026-10-09', NULL, '2026-09-09 08:30:00+00'),
-- Grupo C: vencen pronto (1-10 días) o hoy
('Rubén Prieto Vidal', 30, '2026-08-27', '2026-09-27', NULL, '2026-08-27 09:45:00+00'),
('Nuria Molina Esteban', 35, '2026-08-28', '2026-09-28', NULL, '2026-08-28 10:00:00+00'),
('Gonzalo Ríos Carmona', 30, '2026-08-29', '2026-09-29', NULL, '2026-08-29 11:00:00+00'),
('Teresa Marín Expósito', 35, '2026-08-30', '2026-09-30', NULL, '2026-08-30 09:00:00+00'),
('Hugo Cabrera Montes', 30, '2026-08-31', '2026-09-30', NULL, '2026-08-31 10:30:00+00'),
('Verónica Iglesias Parra', 35, '2026-09-01', '2026-10-01', NULL, '2026-09-01 08:00:00+00'),
('Manuel Fuentes Romero', 30, '2026-09-02', '2026-10-02', NULL, '2026-09-02 09:00:00+00'),
('Elisa Crespo Jiménez', 35, '2026-09-03', '2026-10-03', NULL, '2026-09-03 10:00:00+00'),
('Tomás Guerrero Sáez', 30, '2026-09-04', '2026-10-04', 'Nuevo', '2026-09-04 08:30:00+00'),
('Lorena Vargas Blanco', 35, '2026-09-05', '2026-10-05', 'Nueva', '2026-09-05 09:00:00+00'),
('Guillermo Ortiz Ponce', 30, '2026-08-27', '2026-09-27', NULL, '2026-08-27 10:00:00+00'),
('Adriana Esteban Roca', 35, '2026-08-28', '2026-09-28', NULL, '2026-08-28 11:00:00+00'),
('Enrique Herrera Duran', 30, '2026-08-29', '2026-09-29', NULL, '2026-08-29 09:00:00+00'),
('Mónica Casado Bernal', 35, '2026-08-30', '2026-09-30', NULL, '2026-08-30 10:00:00+00'),
('Roberto Peña Navarro', 30, '2026-08-31', '2026-09-30', NULL, '2026-08-31 11:00:00+00'),
('Susana Ibáñez Cortés', 35, '2026-08-26', '2026-09-26', NULL, '2026-08-26 08:30:00+00'),
-- Grupo D: vencidos hace 1-30 días
('Joaquín Alonso Rubio', 30, '2026-08-25', '2026-09-25', NULL, '2026-08-25 09:45:00+00'),
('Pilar Vega Medina', 35, '2026-08-23', '2026-09-23', NULL, '2026-08-23 10:00:00+00'),
('Ángel Ramos Fuentes', 30, '2026-08-21', '2026-09-21', NULL, '2026-08-21 11:00:00+00'),
('Gloria Mora Díaz', 35, '2026-08-19', '2026-09-19', NULL, '2026-08-19 08:30:00+00'),
('Héctor Soler Pascual', 30, '2026-08-15', '2026-09-15', NULL, '2026-08-15 09:00:00+00'),
('Rebeca Martos Correa', 35, '2026-08-12', '2026-09-12', NULL, '2026-08-12 10:00:00+00'),
('Alfredo Parra Gallardo', 30, '2026-08-07', '2026-09-07', NULL, '2026-08-07 11:00:00+00'),
('Consuelo Abad Serrano', 35, '2026-08-02', '2026-09-02', 'Avisada', '2026-08-02 09:00:00+00'),
('Ismael Navas Bermejo', 30, '2026-07-30', '2026-08-30', NULL, '2026-07-30 10:00:00+00'),
('Yolanda Carrasco Leal', 35, '2026-07-28', '2026-08-28', NULL, '2026-07-28 11:00:00+00'),
('Emilio Santana Moya', 30, '2026-07-26', '2026-08-26', NULL, '2026-07-26 08:30:00+00'),
('Rocío Cabello Rivas', 35, '2026-08-24', '2026-09-24', NULL, '2026-08-24 09:00:00+00'),
('Valentín Ojeda Hidalgo', 30, '2026-08-22', '2026-09-22', NULL, '2026-08-22 10:00:00+00'),
('Dolores Trujillo Camacho', 35, '2026-08-20', '2026-09-20', NULL, '2026-08-20 11:00:00+00'),
('Nicolás Aragonés Vera', 30, '2026-08-17', '2026-09-17', 'Confirmar', '2026-08-17 09:30:00+00'),
-- Grupo E: vencidos ~2 meses
('Manuela Exposito Rueda', 35, '2026-07-23', '2026-08-23', NULL, '2026-07-23 10:00:00+00'),
('Francisco Mora Hervas', 30, '2026-07-18', '2026-08-18', NULL, '2026-07-18 11:00:00+00'),
('Magdalena Polo Torrent', 35, '2026-07-10', '2026-08-10', NULL, '2026-07-10 09:00:00+00'),
('Dionisio Campos Rioja', 30, '2026-07-05', '2026-08-05', NULL, '2026-07-05 10:00:00+00'),
('Encarnación Lara Peña', 35, '2026-06-30', '2026-07-30', NULL, '2026-06-30 11:00:00+00'),
('Primitivo Saez Beltran', 30, '2026-06-25', '2026-07-25', NULL, '2026-06-25 09:00:00+00'),
('Asunción Gil Montoya', 35, '2026-06-21', '2026-07-21', NULL, '2026-06-21 10:00:00+00'),
('Celestino Bravo Macias', 30, '2026-06-14', '2026-07-14', NULL, '2026-06-14 11:00:00+00'),
('Milagros Vidal Carrillo', 35, '2026-06-09', '2026-07-09', NULL, '2026-06-09 08:30:00+00'),
('Serafín Muñoz Dávila', 30, '2026-06-04', '2026-07-04', NULL, '2026-06-04 09:15:00+00'),
('Concepción Ríos Sevilla', 35, '2026-05-30', '2026-06-30', NULL, '2026-05-30 10:00:00+00'),
('Prudencio Serna Palomo', 30, '2026-07-15', '2026-08-15', NULL, '2026-07-15 11:00:00+00'),
('Trinidad Rubiales Cano', 35, '2026-07-02', '2026-08-02', NULL, '2026-07-02 09:00:00+00'),
('Saturnino Plaza Arce', 30, '2026-06-28', '2026-07-28', NULL, '2026-06-28 10:00:00+00'),
('Remedios Ojeda Heredia', 35, '2026-06-23', '2026-07-23', NULL, '2026-06-23 11:00:00+00'),
-- Grupo F: vencidos hace 3-8 meses
('Genaro Esteve Fuster', 30, '2026-05-25', '2026-06-25', NULL, '2026-05-25 08:00:00+00'),
('Amalia Carbonell Mira', 35, '2026-05-21', '2026-06-21', 'Volvería', '2026-05-21 09:00:00+00'),
('Leoncio Pedrosa Vera', 30, '2026-05-04', '2026-06-04', NULL, '2026-05-04 10:00:00+00'),
('Rosario Cobo Almeida', 35, '2026-04-20', '2026-05-20', NULL, '2026-04-20 11:00:00+00'),
('Narciso Quiles Pla', 30, '2026-04-04', '2026-05-04', NULL, '2026-04-04 09:30:00+00'),
('Amparo Zamorano Ortiz', 35, '2026-03-21', '2026-04-21', NULL, '2026-03-21 10:00:00+00'),
('Blas Marqués Cifuentes', 30, '2026-03-04', '2026-04-04', NULL, '2026-03-04 11:00:00+00'),
('Josefa Montoya Alarcón', 35, '2026-02-18', '2026-03-18', NULL, '2026-02-18 08:00:00+00'),
('Estanislao Vera Fajardo', 30, '2026-02-02', '2026-03-02', NULL, '2026-02-02 09:00:00+00'),
('Felisa Poveda Soler', 35, '2026-01-19', '2026-02-19', NULL, '2026-01-19 10:00:00+00'),
('Atilano Tejada Muro', 30, '2026-05-09', '2026-06-09', NULL, '2026-05-09 11:00:00+00'),
('Obdulia Chavarría Linares', 35, '2026-04-29', '2026-05-29', NULL, '2026-04-29 09:00:00+00'),
('Fulgencio Moral Escudero', 30, '2026-04-09', '2026-05-09', NULL, '2026-04-09 10:00:00+00'),
('Hortensia Moya Salinas', 35, '2026-03-30', '2026-04-30', NULL, '2026-03-30 11:00:00+00'),
('Nemesio Cuesta Arroyo', 30, '2026-03-09', '2026-04-09', NULL, '2026-03-09 08:30:00+00'),
('Escolástica Vela Mata', 35, '2026-02-27', '2026-03-27', NULL, '2026-02-27 09:00:00+00'),
('Plácido Rincón Fuerte', 30, '2026-05-28', '2026-06-28', NULL, '2026-05-28 10:00:00+00'),
('Evarista Mendez Sola', 35, '2026-04-27', '2026-05-27', NULL, '2026-04-27 11:00:00+00'),
('Anselmo Leal Bautista', 30, '2026-03-28', '2026-04-28', NULL, '2026-03-28 09:30:00+00'),
('Filomena Heras Costas', 35, '2026-02-25', '2026-03-25', NULL, '2026-02-25 10:00:00+00');

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
