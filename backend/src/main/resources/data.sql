INSERT INTO usuarios (id, nombre, email, password, rol, activo)
VALUES
  ('00000000-0000-0000-0000-000000000001','Dr. Rafael Eduardo Marrero Padilla','rafael.marrero@medfis.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17ldsq','MEDICO',TRUE),
  ('00000000-0000-0000-0000-000000000002','Administrador MedFis','admin@medfis.com','$2a$10$9a4sCBMHFjsS9Gck3Lra1eH.LmFO4ZvS9zY0FyMRSGAD37nEj8XCi','ADMINISTRADOR',TRUE),
  ('00000000-0000-0000-0000-000000000003','Auxiliar Recepcion','auxiliar@medfis.com','$2a$10$rjJFoSLlGAqolFAaZRz3aeEtHimGiKMCgF9eWI9Fv4MUGrJNVxjoy','AUXILIAR',TRUE)
ON CONFLICT (email) DO NOTHING;
