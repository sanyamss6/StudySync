import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class StudySyncServer {

    private static final Map<String, String> rooms =
            new ConcurrentHashMap<>();

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(
                new InetSocketAddress(8080), 0);

        server.createContext("/api/rooms", exchange -> {
            addCorsHeaders(exchange);

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }

            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI().getPath();

            try {
                if ("GET".equalsIgnoreCase(method)
                        && "/api/rooms".equals(path)) {
                    sendJson(exchange, 200, roomsJson());
                } else if ("POST".equalsIgnoreCase(method)
                        && "/api/rooms".equals(path)) {
                    String body = new String(
                            exchange.getRequestBody().readAllBytes(),
                            StandardCharsets.UTF_8);

                    String name = extractName(body);

                    if (name.isBlank()) {
                        sendJson(exchange, 400,
                                "{\"error\":\"Room name is required\"}");
                        return;
                    }

                    String code = UUID.randomUUID()
                            .toString().replace("-", "")
                            .substring(0, 6).toUpperCase();

                    rooms.put(code, name);

                    sendJson(exchange, 201,
                            "{\"name\":\"" + escape(name)
                            + "\",\"code\":\"" + code + "\"}");
                } else if ("POST".equalsIgnoreCase(method)
                        && path.matches("/api/rooms/[^/]+/join")) {
                    String[] parts = path.split("/");
                    String code = parts[3].toUpperCase();

                    if (!rooms.containsKey(code)) {
                        sendJson(exchange, 404,
                                "{\"error\":\"Room not found\"}");
                    } else {
                        sendJson(exchange, 200,
                                "{\"message\":\"Joined room successfully\","
                                + "\"name\":\"" + escape(rooms.get(code))
                                + "\",\"code\":\"" + code + "\"}");
                    }
                } else {
                    sendJson(exchange, 404,
                            "{\"error\":\"Endpoint not found\"}");
                }
            } catch (Exception e) {
                sendJson(exchange, 500,
                        "{\"error\":\"Internal server error\"}");
            }
        });

        server.start();
        System.out.println(
                "StudySync API running at http://localhost:8080");
        System.out.println("Rooms endpoint: http://localhost:8080/api/rooms");
    }

    private static String extractName(String body) {
        java.util.regex.Matcher matcher =
                java.util.regex.Pattern.compile(
                        "\"name\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"")
                .matcher(body);

        if (!matcher.find()) {
            return "";
        }

        return matcher.group(1)
                .replace("\\\"", "\"")
                .replace("\\\\", "\\")
                .trim();
    }

    private static String roomsJson() {
        List<String> items = new ArrayList<>();

        rooms.forEach((code, name) ->
                items.add("{\"name\":\"" + escape(name)
                        + "\",\"code\":\"" + code + "\"}"));

        return "[" + String.join(",", items) + "]";
    }

    private static String escape(String value) {
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    private static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set(
                "Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set(
                "Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set(
                "Access-Control-Allow-Headers", "Content-Type");
        exchange.getResponseHeaders().set(
                "Content-Type", "application/json; charset=UTF-8");
    }

    private static void sendJson(
            HttpExchange exchange, int status, String json)
            throws IOException {

        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(status, bytes.length);

        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }
}
