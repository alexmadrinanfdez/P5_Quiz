# quiz-site
Aplicación web de servidor generada por express-generator y desplegada en la plataforma Heroku.

Basada en la estructura MVC:
* **Modelo** (model)
* **Vista** (view)
* **Controlador** (controller)
## Autor
Incluye una página con información del autor.
## Vista
### Diseño adaptativo
La página web se adapta al tamaño de la pantalla para mostrar su contenido:
* *Vista básica*: sirve de base y está presente en todos los casos.
* *Vista ancha*: para pantallas grandes.
* *Vista estrecha*: para pantallas pequeñas, tipo móvil.
### Layout
Además, las vistas cuentan con un molde común (*layout.ejs*), por lo tanto, sólo cambia el cuerpo de la página.
### Paginación
Algunas vistas incorporan paginación
(i.e. dosifican la cantidad de recursos que se muestran al usuario en más de un página).
### Mensajes 'flash'
La aplicación envía mensajes de tipo *flash* entre transacciones para avisar de determinados eventos.
Los mensajes pueden ser:
* Informativos
* De éxito
* De error
## Quizzes
La aplicación es un almacén de quizzes. Las acciones permitidas para los quizzes son:
* Crear
* Modificar
* Borrar
* Jugar (intentar responder correctamente)
* Mostrar
### Autoload
El recurso **Quizzes** utiliza autoload del parámetro *:quizId* para simplificar el código del controlador.
Este método consiste, básicamente, en introducir otro MW que responda a dicho parámetro y actúe en consecuencia.
### Búsqueda
Podemos buscar un quiz en concreto a través de sus preguntas.
La búsqueda se implementa como un parámetro que pasamos a la base de datos (opciones de búsqueda).
## Pistas
El los quizzes pueden incluir pistas (*tips*). Sólo en determinadas vistas es posible visualizar y crear pistas.
## Usuarios
La aplicación cuenta con un sistema de usuarios.
Cada usuario posee una contraseña (que siempre se **encripta** antes de enviarla).
### Autores
Los usuarios pueden convertirse en autores si crean quizzes.
Se indica al lado de cada quiz quién es su autor *(by "author")*.
#### My quizzes
Cuando el usuario ha iniciado sesión, además, se aparece una pestaña (*My quizzes*) con los quizzes creados por él.
### Sesión
Los usuarios tienen opción de inciar y cerrar sesión cuando quieran.
Además, hay un tiempo límite de inactividad para que la sesión no se cierre automáticamente (5 minutos).
## DDBB (Modelo)
Como base datos, en desarrollo, utilizamos SQLite (a través de un ORM, Sequelize).
En producción utilizamos Postgres (Heroku Postgres).
### Migraciones
Las migraciones nos permiten ir aumentando el tamaño de nuestro modelo paulatinamente sin tener que empezar de cero cada vez.
### Semillas
Las semillas inicializan los modelos con los valores que definamos en un principio.
## Autorización
Se restrigen determinadas actividades según el usuario este logueado o no.
