# -*- coding: utf-8 -*-
"""single_prediction.ipynb

Automatically generated by Colaboratory.

Original file is located at
    https://colab.research.google.com/drive/1J9u7hweBw5TPyIZbmeUVaf1BAWipeVj0
"""

import subprocess
import sys

message = sys.argv[1]

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

# install("transformers")
# install("sentencepiece")
# install("pandas")
# install("numpy")
# install("nltk")
# install("scikit-learn")
# install("torch")

import transformers
import sentencepiece
import pandas as pd
import numpy as np
from os import listdir
from tqdm import tqdm, trange
import textwrap
import nltk
import random
import re
import sys
from sklearn.preprocessing import LabelEncoder
import torch
from torch.utils.data import TensorDataset, DataLoader, RandomSampler, SequentialSampler
import torch.nn as nn
from transformers import CamembertTokenizer, CamembertForSequenceClassification, AdamW
from transformers import AutoModelForSequenceClassification, AutoTokenizer, CamembertConfig, CamembertModel
from transformers import AutoConfig
from transformers import AutoModelForSequenceClassification
from transformers import logging
from transformers.models.roberta.modeling_roberta import RobertaClassificationHead
from keras_preprocessing.sequence import pad_sequences
from sklearn.model_selection import train_test_split
from torch.nn import MSELoss, CrossEntropyLoss, BCEWithLogitsLoss
from transformers.modeling_outputs import SequenceClassifierOutput



longueur_max = 512
batch_size = 12
epochs = 4
learning_rate = 2e-5
encodeur = LabelEncoder()

#we get rid of stopwords because of maximum sequence length for camembert_base model
import string
from nltk.corpus import stopwords
nltk.download('stopwords')
stopwordsRegex = '(?:^|(?<= ))('+"|".join(stopwords.words('french'))+')(?:(?= )|$)'
punctuationRegex = '['+string.punctuation+']'

def remove(txt, regex):
  res = re.sub(regex,' ',txt)
  return res

def clean(sentence):
  sentence = str(sentence)
  sentence = remove(sentence, '\s+')
  sentence = remove(sentence, '[…|°|;|×|/|-]')
  sentence = remove(sentence, punctuationRegex)
  sentence = remove(sentence, stopwordsRegex)
  sentence = sentence.lower()
  return sentence

#import du modèle
nom_modele = "camembert-base"
camembert_tokenizer = CamembertTokenizer.from_pretrained(nom_modele, do_lower_case=True)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
_model_type = 'roberta'
config = CamembertConfig.from_pretrained(nom_modele)
config.num_labels = 4
add_pooler = True
reinit_pooler = True

class Net(nn.Module):
    def __init__(self, config, nom_modele, add_pooler):
        super(Net, self).__init__()
        self.num_labels = config.num_labels
        self.config = config

        self.roberta = CamembertModel.from_pretrained(nom_modele, add_pooling_layer=add_pooler)
        self.classifier = RobertaClassificationHead(config)
        
    def forward(self, input_ids, attention_mask, token_type_ids=None, labels=None, return_dict=None, output_attentions=None, output_hidden_states=None):
        return_dict = return_dict if return_dict is not None else self.config.use_return_dict

        outputs = self.roberta(
            input_ids,
            attention_mask=attention_mask,
            token_type_ids=token_type_ids,
            output_attentions=output_attentions,
            output_hidden_states=output_hidden_states
        )
        sequence_output = outputs[0]
        logits = self.classifier(sequence_output)

        loss = None
        if labels is not None:
            if self.config.problem_type is None:
                if self.num_labels == 1:
                    self.config.problem_type = "regression"
                elif self.num_labels > 1 and (labels.dtype == torch.long or labels.dtype == torch.int):
                    self.config.problem_type = "single_label_classification"
                else:
                    self.config.problem_type = "multi_label_classification"

            if self.config.problem_type == "regression":
                loss_fct = MSELoss()
                if self.num_labels == 1:
                    loss = loss_fct(logits.squeeze(), labels.squeeze())
                else:
                    loss = loss_fct(logits, labels)
            elif self.config.problem_type == "single_label_classification":
                loss_fct = CrossEntropyLoss()
                loss = loss_fct(logits.view(-1, self.num_labels), labels.view(-1))
            elif self.config.problem_type == "multi_label_classification":
                loss_fct = BCEWithLogitsLoss()
                loss = loss_fct(logits, labels)

        if not return_dict:
            output = (logits,) + outputs[2:]
            return ((loss,) + output) if loss is not None else output

        return SequenceClassifierOutput(
            loss=loss,
            logits=logits,
            hidden_states=outputs.hidden_states,
            attentions=outputs.attentions,
        )
        
camembert_model = Net(config, nom_modele, add_pooler)

if reinit_pooler:
    print('Reinitialisation des poids du Pooler ...')
    encoder_temp = getattr(camembert_model, _model_type)
    encoder_temp.pooler.dense.weight.data.normal_(mean=0.0, std=encoder_temp.config.initializer_range)
    encoder_temp.pooler.dense.bias.data.zero_()
    for p in encoder_temp.pooler.parameters():
        p.requires_grad = True
    print('Pooler réinitialisé.')

camembert_model.to(device)

PATH = "./model/camembert_model.pth"
camembert_model = torch.load(PATH, map_location=torch.device('cpu'))

def decode(cellule):
  if cellule == 0 :
    cellule = "{false}"
  if cellule == 1 :
    cellule = "{true}"
  return cellule

def single_prediction(message,encodeur):
  # Tokenisation de validation data
  validation_tokenized_ids = [camembert_tokenizer.encode(message, add_special_tokens=True,truncation=True, max_length=longueur_max)]

  # Padding 
  validation_tokenized_ids = pad_sequences(validation_tokenized_ids, maxlen=longueur_max, dtype="long", padding="post")

  # Masque d'attention pour ne pas prendre en compte les paddings
  masques_attentions = []
  # Un masque avec des 1 pour chaque token et des 0 pour les paddings
  for article_seq in validation_tokenized_ids:
      seq_masque = [float(i>0) for i in article_seq]  
      masques_attentions.append(seq_masque)

  prediction_inputs = torch.tensor(validation_tokenized_ids)
  prediction_masques = torch.tensor(masques_attentions)
  # Application du modèle 
  predictions = []
  with torch.no_grad():
     # Passage et calcul des predictions
     outputs =  camembert_model(prediction_inputs.to(device),token_type_ids=None, attention_mask=prediction_masques.to(device))
     logits = outputs[0]
     logits = logits.detach().cpu().numpy() 
     predictions.extend(np.argmax(logits, axis=1).flatten())
  #df["prediction"] = predictions
  #df["prediction"] = df['prediction'].apply(decode)
  return decode(predictions[0])


final_pred = single_prediction(message,encodeur)
print(final_pred)
sys.stdout.flush()
