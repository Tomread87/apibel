import qrcode

url = "https://apibel.it"

# Create the QR code instance
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_H, # High error correction
    box_size=10,
    border=4,
)

qr.add_data(url)
qr.make(fit=True)

# Generate the image and save it
img = qr.make_image(fill_color="black", back_color="white")
img.save("apibel_qrcode.png")

print("Working QR code generated and saved as 'apibel_qrcode.png'!")