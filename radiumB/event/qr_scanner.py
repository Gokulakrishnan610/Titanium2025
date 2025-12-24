import cv2
from pyzbar.pyzbar import decode

def scan_qr_from_camera():
    """
    Qr code scanner and hash verify function
    """
    cap = cv2.VideoCapture(0)

    print("Press 'q' to quit.")
    qr_hash = None

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        for barcode in decode(frame):
            qr_hash = barcode.data.decode('utf-8')
            print("QR Detected:", qr_hash)
            cap.release()
            cv2.destroyAllWindows()
            return qr_hash

        cv2.imshow('QR Scanner', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    return None

if __name__ == '__main__':
    scan_qr_from_camera()