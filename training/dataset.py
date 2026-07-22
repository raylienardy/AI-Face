import os
import cv2
import torch
from torch.utils.data import Dataset
import pandas as pd

class BeautyDataset(Dataset):
    """
    Dataset untuk training region analyzer.
    Format CSV: kolom pertama 'image_path', diikuti label numerik.
    """
    def __init__(self, csv_path, transform=None):
        self.df = pd.read_csv(csv_path)
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = row['image_path']
        image = cv2.imread(img_path)
        if image is None:
            raise FileNotFoundError(f"Image not found: {img_path}")
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        label = row.drop('image_path').values.astype(float)
        if self.transform:
            image = self.transform(image)
        return image, torch.tensor(label, dtype=torch.float32)