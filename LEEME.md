# Escuadra

Mide con el giroscopio del móvil cuántos grados ha girado el coche desde que marcaste la
referencia, y avisa con pitidos cuando queda paralelo a las líneas de la plaza.

Solo mide el ángulo. No detecta distancias, bordillos, coches ni personas.

## Probar en VS Code (ordenador)

1. Abre esta carpeta en VS Code: Archivo > Abrir carpeta.
2. Instala la extensión **Live Server** (Ritwick Dey).
3. Clic derecho sobre `index.html` > **Open with Live Server**. Se abre en `http://localhost:5500`.
4. Un ordenador no tiene giroscopio: pulsa **Estoy recto** y luego **Probar con simulación**.
   Mueve el deslizador o pulsa **Ver maniobra de ejemplo**.

Con Chrome también puedes fingir un móvil que gira: F12 > menú ⋮ > More tools > **Sensors** > Orientation.

## Probar en el móvil Android con el giroscopio de verdad

Chrome solo da acceso a los sensores por **HTTPS** o en **localhost**. Abrir
`http://192.168.x.x:5500` desde el móvil NO funciona. Tres formas que sí:

**A. Reenvío de puertos de VS Code (la más cómoda)**
Con Live Server en marcha: panel inferior > pestaña **Puertos** > **Reenviar un puerto** > `5500`.
Inicia sesión con GitHub, pon la visibilidad en **Público** (clic derecho sobre el puerto) y abre
en el móvil la dirección `https://...devtunnels.ms` que aparece.

**B. Cable USB**
Activa la depuración USB en el móvil, conéctalo, abre `chrome://inspect` en el Chrome del
ordenador > **Port forwarding** > `5500` → `localhost:5500`. En el móvil abre `http://localhost:5500`.

**C. Publicarla (para uso diario)**
Sube la carpeta a GitHub Pages, Netlify o Cloudflare Pages (gratis, con HTTPS). Ábrela en Chrome
del móvil > menú ⋮ > **Añadir a pantalla de inicio**. Queda instalada a pantalla completa y
funciona sin cobertura.

## Sin cobertura

La app se guarda en el móvil la primera vez que la abres con internet (o por cable) y a partir de
ahí abre sin conexión, también cuando hay señal pero no llegan datos: si la red no responde en
dos segundos y medio, usa la copia guardada. No carga nada de fuera (ni fuentes ni librerías):
todo está en la carpeta. Condiciones:

- Abrirla siempre desde la misma dirección. El icono de la pantalla de inicio guarda la
  dirección con la que la instalaste; una dirección de túnel distinta es "otra web" y no
  tiene copia guardada.
- No borrar los datos del navegador para esa web.
- Cuando cambies algo en la carpeta, recarga dos veces con conexión: la primera trae la versión
  nueva a la caché y la segunda la muestra.

## Uso en el coche

1. Fija el móvil en un soporte rígido. Da igual la inclinación, pero no puede moverse durante la maniobra.
   La app mide cuánto gira el móvil: en el soporte, eso es cuánto gira el coche; en la mano, cualquier
   giro de muñeca cuenta como giro del coche. Si detecta que el móvil se inclina o se sacude, avisa.
2. Coloca el coche recto en el pasillo, **detente del todo** y pulsa **Estoy recto**. Un solo toque:
   enciende los sensores (la primera vez pide permiso) y toma la referencia. Durante dos segundos la
   app se calibra; no te muevas.
3. Maniobra. Los pitidos se aceleran según te acercas; triple pitido agudo = endereza ya; doble
   tono agudo = recto; doble tono grave = te has pasado.

Da igual hacia dónde mire el coche (norte, este…), de qué lado esté el volante o si la plaza
queda a la izquierda o a la derecha: la app solo cuenta los grados girados desde la referencia y
detecta sola el lado en cuanto llevas más de 6°.

## Qué muestra el dibujo

Una vista desde arriba centrada en tu coche, como una cámara 360: tu coche está siempre fijo en
el centro mirando hacia arriba, y a su alrededor se mueven el carril, la plaza, los coches vecinos,
una silueta tenue en el sitio donde tiene que acabar tu coche y una línea de puntos con la
trayectoria. Tu coche es rosa, verde cuando está recto y ámbar si te has pasado. Si giras hacia el
otro lado, la escena se pone en espejo sola.

Con sensores, el coche del dibujo se mueve por **navegación a estima**: la app estima la velocidad
con el acelerómetro (y con el giro, porque un coche no puede girar sin rodar) y lo desplaza en la
dirección a la que apunta. Girando, la posición se corrige hacia la trayectoria geométrica; en recto
manda solo el movimiento medido: si no te mueves, no se mueve. La distancia estimada con un móvil
deriva al cabo de unos segundos, así que la posición es orientativa; el ángulo sí es exacto.

**Es orientativo.** Lo único medido es el ángulo. La posición sale del tamaño de coche elegido en
Ajustes > **Mi coche** (pequeño, mediano o grande; por defecto pequeño, tipo Smart) suponiendo el
volante a tope. Con ese tamaño se calculan la trayectoria, el punto de parada y el tramo recto
final. Girando el volante menos, la trayectoria real cambia. No mires el dibujo para saber a qué
distancia estás de nada: mira el coche.

Con "Entro marcha atrás" el coche entra de culo y las plazas se dibujan en consecuencia. En línea
la escena es una calle con acera, dos coches aparcados y el hueco entre ellos.

Las plazas en espiga (60° o 45°), el margen, la voz y la entrada marcha atrás están en **Ajustes**.

## Referencias para aparcar (botón "Cómo se hace")

Contadas con la plaza a la derecha; a la izquierda es igual pero al revés.

- **Batería de frente**: ve por el pasillo lo más lejos posible de las plazas. Para cuando tu hombro
  esté a la altura de la primera línea de la plaza. Pulsa "Estoy recto", volante a tope hacia la
  plaza y avanza despacio. "Endereza" = ve poniendo el volante derecho; "recto" = entra derecho.
- **Batería marcha atrás**: pasa la plaza a un metro de los coches. Para cuando la plaza quede detrás
  de tu asiento (hombro a la altura de la línea más lejana). "Estoy recto", volante a tope hacia la
  plaza y marcha atrás despacio.
- **Espiga**: igual que de frente, con menos giro.
- **En línea**: al lado del coche de delante del hueco, a medio metro, trasera con trasera. "Estoy
  recto", volante a tope hacia la acera, marcha atrás. Cuando diga "volante al otro lado", a tope
  al otro lado y sigue atrás. "Recto" = para, volante derecho y avanza un poco para centrarte.

## Salir de la plaza

Encima del botón grande hay un selector **Entrar en la plaza / Salir de la plaza** (solo en batería y
espiga; en línea no hay un ángulo fijo de salida). Al salir, la maniobra es la de entrar al revés: con
el coche recto dentro de la plaza pulsas "Estoy recto", sales recto, y cuando el hombro pasa la línea
de los coches de al lado giras a tope hacia el pasillo; "recto" significa paralelo al pasillo. El
dibujo y el tutorial muestran la salida, y la silueta de destino se pone en el pasillo.

## ¿Avanza o retrocede?

El giroscopio no lo sabe. La app lo intenta deducir con el acelerómetro, de forma orientativa: al
arrancar desde parado mira hacia dónde empuja el coche, y en curva hacia qué lado apunta la
aceleración respecto al sentido del giro. Supone que el móvil va de pie en el soporte con la
pantalla hacia el conductor (o tumbado con la parte de arriba hacia delante). Mientras no lo
detecta, usa el ajuste "Entro marcha atrás". Se muestra bajo el número grande ("Sentido").

## Modo noche, sonido y diario

- **Pantalla**: automático (oscuro de noche o si el móvil está en modo oscuro), claro u oscuro.
- **Pitidos por el lado que toca**: suenan por el oído del lado hacia el que hay que girar y por los dos
  cuando estás recto (con auriculares o el equipo del coche).
- **Retardo Bluetooth**: si el sonido va por el equipo del coche llega con retraso; se elige cuánto
  (0,3, 0,6 o 1 s) y la app adelanta el aviso de "endereza" ese tiempo.
- **Diario de aparcamientos**: cada "recto" se apunta con el tipo de plaza, cuánto te pasaste y lo que
  tardaste. Se ve en Ajustes y se puede borrar.
- **Comprobar sensores**: en Ajustes, valores en vivo de orientación, aceleración, giro y sentido, con
  botón de copiar, para diagnosticar sin adivinar.
- **Abrirla sola en el coche**: en Ajustes, los tres pasos de la app Atajos del iPhone para que se abra
  al conectar CarPlay o el Bluetooth del coche, y para decir "Oye Siri, aparcar".

## Ayudas para aparcar

- **Voz**: "Endereza", "Recto", "Te has pasado". Para mirar atrás en vez de a la pantalla. Activada por
  defecto. Si además quieres que cante los grados ("Faltan 30… 20… 10"), hay un interruptor aparte,
  apagado por defecto.
- **Cámara: coches cercanos (orientativo)**. En Ajustes, "Detectar coches con la cámara". Usa la cámara
  trasera del móvil, que en el soporte mira por el parabrisas, y un modelo de visión (COCO-SSD, en la
  carpeta `modelo/`, unos 18 MB que se guardan para funcionar sin cobertura). Marca los coches que ve y,
  cuando uno ocupa mucha imagen, avisa por voz y con un zumbido grave: "coche muy cerca a la derecha".
  **No mide distancias**: estima la cercanía por el tamaño en la imagen, así que es orientativo. Solo
  sirve entrando de frente; marcha atrás el móvil no ve nada. En el iPhone pide permiso de cámara la
  primera vez y necesita HTTPS.
- **Aviso de "endereza"**: con la velocidad de giro calcula cuánto va a seguir girando el coche
  (unas seis décimas de segundo de reacción) y avisa antes de llegar, con un triple pitido agudo.
- **Aprender de mis maniobras**: tras cada aviso mide cuántos grados te has pasado o te has quedado
  corto y adelanta o retrasa el aviso siguiente. Se guarda solo en el móvil. En Ajustes se ve cuánto ha
  aprendido y se puede olvidar.
- **Aparcar en línea** (entre dos coches, paralelo a la acera): en Ajustes, tipo de plaza "En línea".
  Marca la referencia paralelo a los coches aparcados, con tu trasera a la altura de la trasera del
  coche de delante. Marcha atrás girando hacia la acera: a los 45° avisa "gira el volante al otro
  lado". Contragira y, cuando vuelvas a 0°, dice "recto". Los 45° son la regla general; en un coche
  muy corto, como un Smart, suele bastar con algo menos, así que puedes empezar a contragirar en
  cuanto avise.

## Cómo funciona

- `deviceorientation` entrega la orientación completa del móvil (alfa, beta, gamma), que el sistema
  calcula fusionando giroscopio y acelerómetro. Con ella se monta la matriz de rotación y se mira
  hacia dónde apunta, sobre el plano horizontal, el eje del móvil que esté más tumbado al marcar la
  referencia. El cambio de ese rumbo es el giro del coche sobre el suelo. Inclinar el móvil no lo
  altera, y no depende de cómo numere cada sistema los ejes del giroscopio (en el iPhone no
  coinciden con Android, y la versión anterior contaba la inclinación como giro).
- `devicemotion` solo se usa para saber si hay giroscopio y para detectar que el móvil se manipula.
- Precisión esperable en una maniobra de menos de un minuto: en torno a ±1°. En rampas pronunciadas empeora.
- Sin giroscopio, la orientación sale de la brújula, bastante menos fiable dentro de un coche.

## Pruebas

`node pruebas.js` pasa una batería de más de 70 pruebas sin abrir un navegador: comprobaciones
estáticas (sintaxis, ids, archivos, modelo), sensores simulados (giro, inclinación, manipulación,
sentido, iPhone y Android), todos los modos y lados, ajustes, geometría (sin choques con los
vecinos, trayectoria continua), tutorial, cámara y una sección de casos de la vida real (rampa,
baches, brújula, ruido, paradas a mitad, dos maniobras seguidas, doble toque, app en segundo
plano, deriva...).

## Archivos

- `index.html`: toda la app (interfaz, estilos y lógica).
- `manifest.webmanifest`, `icon.svg`, `icon-180.png`, `sw.js`: la hacen instalable (Android e iPhone) y
  utilizable sin conexión.
- `modelo/`: TensorFlow.js y el modelo COCO-SSD para la detección de coches con la cámara.
- `pruebas.js`: la batería de pruebas (node).
