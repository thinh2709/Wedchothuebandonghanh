package com.hutech.nguyenphucthinh.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;

public class FileStorageUtil {

    private FileStorageUtil() {
    }

    public static String storeImage(MultipartFile file, Path targetDir, String filePrefix) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File ảnh không hợp lệ");
        }

        Files.createDirectories(targetDir);

        // Giữ phần đuôi (nếu có) để browser nhận đúng định dạng.
        String originalName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String ext = "";
        int dot = originalName.lastIndexOf('.');
        if (dot >= 0 && dot < originalName.length() - 1) {
            ext = originalName.substring(dot + 1).toLowerCase(Locale.ROOT).trim();
        }
        // fallback nếu ext lạ
        if (ext.isEmpty() || ext.length() > 5) {
            ext = "jpg";
        }

        String filename = String.format("%s-%s.%s", filePrefix, UUID.randomUUID(), ext);
        Path dest = targetDir.resolve(filename);

        // Copy file vào thư mục lưu trữ.
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        // Trả về URL tương đối (WebConfig sẽ map /uploads/** -> thư mục uploads).
        // urlSubDir là đường dẫn tương đối bên dưới thư mục uploads/.
        Path p = targetDir;
        while (p != null && (p.getFileName() == null || !"uploads".equalsIgnoreCase(p.getFileName().toString()))) {
            p = p.getParent();
        }
        if (p == null) {
            // fallback: vẫn trả về theo tên thư mục cuối, dù có thể lệch cấu trúc.
            return "/uploads/" + targetDir.getFileName() + "/" + filename;
        }
        Path rel = p.relativize(targetDir);
        String relStr = rel.toString().replace('\\', '/');
        return "/uploads/" + relStr + "/" + filename;
    }
}

