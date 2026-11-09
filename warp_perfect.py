import cv2
import numpy as np

up = cv2.imread('C:/Users/Lenovo/.gemini/antigravity/brain/ab7e3245-660e-4b26-82ac-761ab86858c5/.user_uploaded/media_1791461520101.jpg')
st = cv2.imread('msu_district_ultra_wide.jpg')

# SIFT
sift = cv2.SIFT_create(5000)
kp1, des1 = sift.detectAndCompute(up, None)
kp2, des2 = sift.detectAndCompute(st, None)
bf = cv2.BFMatcher()
matches = bf.knnMatch(des1, des2, k=2)
good = [m for m, n in matches if m.distance < 0.72 * n.distance]

src_pts = np.float32([kp1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
dst_pts = np.float32([kp2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)

# Generate 4x high-res (4096 x 1716)
scale_4x = 4.0
w_4x = int(up.shape[1] * scale_4x)
h_4x = int(up.shape[0] * scale_4x)

S_4x = np.array([[scale_4x, 0, 0], [0, scale_4x, 0], [0, 0, 1]], dtype=np.float32)
H_4x = H @ np.linalg.inv(S_4x)
inv_H_4x = np.linalg.inv(H_4x)

warped_4x = cv2.warpPerspective(st, inv_H_4x, (w_4x, h_4x), flags=cv2.INTER_CUBIC)
cv2.imwrite('msu_exact_district_hd.jpg', warped_4x, [cv2.IMWRITE_JPEG_QUALITY, 95])
print('Saved msu_exact_district_hd.jpg! Size:', warped_4x.shape)

# Generate full 8858 px width (8858 x 3711) for true 300 DPI print
scale_8x = 8858.0 / up.shape[1]
w_8x = 8858
h_8x = int(up.shape[0] * scale_8x)

S_8x = np.array([[scale_8x, 0, 0], [0, scale_8x, 0], [0, 0, 1]], dtype=np.float32)
H_8x = H @ np.linalg.inv(S_8x)
inv_H_8x = np.linalg.inv(H_8x)

warped_8x = cv2.warpPerspective(st, inv_H_8x, (w_8x, h_8x), flags=cv2.INTER_CUBIC)
cv2.imwrite('msu_exact_district_300dpi_raw.jpg', warped_8x, [cv2.IMWRITE_JPEG_QUALITY, 95])
print('Saved msu_exact_district_300dpi_raw.jpg! Size:', warped_8x.shape)
