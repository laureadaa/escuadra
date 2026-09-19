# Escuadra

Mide con el giroscopio del móvil cuántos grados ha girado el coche desde que marcaste la
referencia, y avisa con pitidos cuando queda paralelo a las líneas de la plaza.

Solo mide el ángulo. No detecta distancias, bordillos, coches ni personas.

## Probar en VS Code (ordenador)

1. Abre esta carpeta en VS Code: Archivo > Abrir carpeta.
2. Instala la extensión **Live Server** (Ritwick Dey).
3. Clic derecho sobre `index.html` > **Open with Live Server**. Se abre en `http://localhost:5500`.
4. Un ordenador no tiene giroscopio: pulsa **Activar sensores** y luego **Probar con simulación**.
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
2. Pulsa **Empezar**.
3. Coloca el coche recto en el pasillo, **detente del todo** y pulsa **Estoy recto**. Durante
   dos segundos la app se calibra; no te muevas.
4. Maniobra. Los pitidos se aceleran según te acercas; triple pitido agudo = endereza ya; doble
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

En batería y espiga el giro termina en la boca de la plaza y el último tramo se hace recto: cuando
la app dice "recto", el dibujo mete el coche derecho en su sitio.

**Es orientativo.** Lo único medido es el ángulo. La posición sale de suponer un coche de 4,2 m
con un radio de giro de 3,6 m; con un coche distinto o girando el volante más o menos, la
trayectoria real cambia. No mires el dibujo para saber a qué distancia estás de nada: mira el coche.

Con "Entro marcha atrás" el coche entra de culo y las plazas se dibujan en consecuencia. En línea
la escena es una calle con acera, dos coches aparcados y el hueco entre ellos.

Las plazas en espiga (60° o 45°), el margen, la voz y la entrada marcha atrás están en **Ajustes**.

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

## Archivos

- `index.html`: toda la app (interfaz, estilos y lógica).
- `manifest.webmanifest`, `icon.svg`, `icon-180.png`, `sw.js`: la hacen instalable (Android e iPhone) y
  utilizable sin conexión.
- `modelo/`: TensorFlow.js y el modelo COCO-SSD para la detección de coches con la cámara.
