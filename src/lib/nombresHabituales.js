// Nombres de pila habituales (él, v64.5), para que la Revisión vea cuándo
// uno está «a todas luces» mal escrito: si un nombre no está aquí pero se
// queda a una letra de uno que sí («Pedo» → «Pedro»). Con tildes: así se
// sugiere bien escrito. Españoles, canarios y los diminutivos de siempre.
// Un nombre raro pero bien escrito que no se parece a ninguno no salta;
// si se parece y es correcto, se marca la excepción en la Revisión.
const HOMBRES = `Aarón, Abel, Abián, Abraham, Acaymo, Adán, Aday, Adexe, Adolfo, Adrián,
Agustín, Airam, Aitor, Alberto, Albert, Alejandro, Alex, Álex, Alfonso, Alfredo, Álvaro,
Amador, Ancor, Andrés, Ángel, Anselmo, Antonio, Arnau, Arturo, Asier, Augusto, Aurelio,
Ayoze, Ayose, Aythami, Baltasar, Basilio, Benehare, Beneharo, Bencomo, Benito, Benjamín,
Bentor, Bernardo, Biel, Bruno, Camilo, Carlos, Casimiro, Ceferino, Celestino, César,
Christian, Cipriano, Clemente, Cristian, Cristóbal, Damián, Daniel, Dani, David, Diego,
Domingo, Doramas, Dylan, Echedey, Eduardo, Elías, Eloy, Emiliano, Emilio, Ender, Enric,
Enrique, Eric, Erik, Ernesto, Esteban, Eusebio, Evaristo, Ezequiel, Fabián, Fausto,
Federico, Felipe, Félix, Fernando, Fidel, Florencio, Fran, Francisco, Fulgencio, Gabriel,
Gael, Gerardo, Germán, Gilberto, Gonzalo, Gregorio, Guillermo, Gustavo, Héctor,
Heriberto, Hernán, Hilario, Horacio, Hugo, Humberto, Ignacio, Iker, Inocencio, Iriome,
Isidro, Ismael, Iván, Izan, Jacinto, Jacobo, Jacob, Jaime, Javi, Javier, Jerónimo,
Jesús, Joan, Joaquín, Joel, Jonás, Jonatan, Jonathan, Jonay, Jordi, Jorge, José, Josema,
Josep, Josué, Juan, Juanjo, Juanma, Julián, Julio, Justo, Kevin, Kilian, Leandro,
Leonardo, Leopoldo, Leo, Liam, Lorenzo, Lucas, Luciano, Lucio, Luis, Manolo, Manuel,
Marc, Marcelino, Marcelo, Marcial, Marco, Marcos, Mariano, Mario, Martín, Mateo, Matías,
Mauricio, Maximiliano, Maximino, Melchor, Mencey, Miguel, Mikel, Moisés, Narciso, Nacho,
Nauzet, Nelson, Néstor, Nicanor, Nicolás, Nil, Norberto, Octavio, Omar, Oriol, Orlando,
Óscar, Pablo, Paco, Pascual, Patricio, Pau, Pedro, Pepe, Plácido, Pol, Porfirio,
Primitivo, Prudencio, Quique, Rafa, Rafael, Raimundo, Ramiro, Ramón, Raúl, Reinaldo,
Ricardo, Roberto, Rodrigo, Rogelio, Rolando, Román, Rosendo, Rubén, Rufino, Salvador,
Samuel, Sancho, Santi, Santiago, Saúl, Sebastián, Sergio, Severiano, Silvestre, Simón,
Sixto, Tadeo, Tanausú, Teodoro, Teófilo, Thiago, Tinguaro, Tobías, Tomás, Toni, Ulises,
Unai, Urbano, Valentín, Valeriano, Venancio, Vicente, Víctor, Wenceslao, Xavier, Yeray,
Yoel, Yonatan, Zacarías`;

const MUJERES = `Abril, Adela, Adriana, Agustina, Ainara, Ainhoa, Aitana, Alba, Alejandra,
Alexandra, Alexia, Alicia, Alma, Almudena, Amalia, Amparo, Ana, Anabel, Andrea, Ane,
Ángela, Ángeles, Antonia, Aroa, Arantxa, Ariadna, Arminda, Ascensión, Asunción, Aurora,
Bárbara, Bea, Beatriz, Begoña, Belén, Benita, Blanca, Brenda, Camila, Candela,
Candelaria, Carla, Carmela, Carmen, Carolina, Catalina, Cathaysa, Cecilia, Celia, Charo,
Chaxiraxi, Chloe, Clara, Claudia, Concepción, Concha, Conchi, Consuelo, Covadonga, Cris,
Cristina, Dácil, Dania, Daniela, Desiré, Desirée, Diana, Dolores, Dulce, Edurne, Elena, Eli, Elia,
Elisa, Elisabet, Elizabeth, Eloísa, Elsa, Elvira, Emilia, Emma, Encarna, Encarnación,
Erika, Esmeralda, Esperanza, Estefanía, Estela, Esther, Estrella, Eugenia, Eulalia, Eva,
Fabiola, Fátima, Felisa, Fernanda, Filomena, Flor, Florentina, Francisca, Gabriela, Gara,
Gema, Gemma, Gisela, Gloria, Graciela, Guacimara, Guadalupe, Guayarmina, Helena,
Herminia, Hortensia, Iballa, Idaira, Idoia, Inés, Ingrid, Inmaculada, Irene, Iris, Irma,
Isa, Isabel, Isabela, Itahisa, Itziar, Jana, Jazmín, Jennifer, Jessica, Jimena, Josefa,
Josefina, Juana, Judit, Judith, Julia, Juliana, Karen, Karina, Lara, Laura, Leire, Leonor,
Leticia, Lía, Lidia, Liliana, Linda, Lisa, Lola, Loly, Lorena, Loreto, Lourdes, Lucía, Luisa,
Luna, Lupe, Luz, Macarena, Magdalena, Maite, Malena, Manuela, Mar, Margarita, Mari,
Marián, Mariana, Maribel, Mariela, María, Marina, Marisa, Marisol, Marta, Martina,
Matilde, Maya, Mayte, Melania, Melisa, Merche, Mercedes, Meritxell, Mía, Mila, Milagros,
Mireia, Míriam, Mónica, Montse, Montserrat, Nadia, Nahia, Naira, Natalia, Natividad, Nati,
Nayra, Nerea, Nieves, Noa, Noelia, Noemí, Nora, Nuria, Ofelia, Olga, Olivia, Paloma, Paola,
Patricia, Paula, Paz, Petra, Piedad, Pili, Pilar, Pino, Priscila, Pura, Puri,
Purificación, Rafaela, Ramona, Raquel, Rebeca, Regina, Remedios, Reyes, Rita, Rocío,
Rosa, Rosalba, Rosalía, Rosana, Rosario, Rosi, Ruth, Sabina, Sabrina, Sagrario, Salomé,
Samanta, Sandra, Sara, Sarai, Saray, Selena, Sheila, Silvana, Silvia, Socorro, Sofía, Sol,
Soledad, Sole, Sonia, Sonsoles, Susana, Tamara, Tara, Tatiana, Tere, Teresa, Thais,
Trinidad, Úrsula, Valentina, Valeria, Valle, Vanesa, Vanessa, Vega, Vera, Vero, Verónica,
Victoria, Virginia, Visitación, Ximena, Yaiza, Yanira, Yasmina, Yennifer, Yésica, Yessica,
Yoli, Yolanda, Yurena, Zoe, Zulema`;

export const NOMBRES_HABITUALES = `${HOMBRES}, ${MUJERES}`
  .split(",")
  .map((n) => n.trim())
  .filter(Boolean);
