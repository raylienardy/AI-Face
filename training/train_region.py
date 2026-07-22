import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import transforms, models
from torch.utils.data import DataLoader
from dataset import BeautyDataset
import config
import os

def get_model(num_labels):
    model = models.mobilenet_v2(pretrained=True)
    model.classifier[1] = nn.Linear(model.last_channel, num_labels)
    return model

def train():
    # Transformasi (standar ImageNet)
    train_transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # Dataset dummy – ganti dengan dataset sesungguhnya
    # train_dataset = BeautyDataset("data/train_eyes.csv", train_transform)
    # train_loader = DataLoader(train_dataset, batch_size=config.BATCH_SIZE, shuffle=True)

    model = get_model(num_labels=3)  # contoh 3 label
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=config.LEARNING_RATE)

    # Loop pelatihan (kosong, karena dataset belum tersedia)
    for epoch in range(config.EPOCHS):
        # for images, labels in train_loader:
        #     optimizer.zero_grad()
        #     outputs = model(images)
        #     loss = criterion(outputs, labels)
        #     loss.backward()
        #     optimizer.step()
        pass

    os.makedirs(config.MODEL_SAVE_DIR, exist_ok=True)
    torch.save(model.state_dict(), os.path.join(config.MODEL_SAVE_DIR, "eye_model.pth"))
    print("Model dummy saved (ganti dengan training sebenarnya saat dataset siap).")

if __name__ == "__main__":
    train()