# quiz-site
Aplicación web de servidor generada por express-generator y desplegada en la plataforma Heroku.

Basada en la estructura MVC:
* Modelo (model)
* Vista (view)
* Controlador (controller)
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
## DDBB (Modelo)
Como base datos, en desarrollo, utilizamos SQLite (a través de un ORM, Sequelize).
En producción utilizamos Postgres (Heroku Postgres).
