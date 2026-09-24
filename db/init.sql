CREATE DATABASE IF NOT EXISTS veterinaria;
USE veterinaria;

CREATE TABLE IF NOT EXISTS mascotas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    edad INT NOT NULL,
    peso DECIMAL(5,2) NOT NULL
);

INSERT INTO mascotas (nombre, especie, edad, peso) VALUES
    ('Rocky', 'Perro', 5, 18.30),
    ('Milo', 'Gato', 2, 4.10),
    ('Nina', 'Conejo', 1, 1.75);
