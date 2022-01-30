# import des library
import cv2
import sys

import numpy as np

import pandas as pd

import pytesseract

import string
import re
import pickle
import urllib.request


# � modifier pour executable
# modifer le path pour relier � l'image

src_path = sys.argv[1]
# print(src_path)

# lecture de l'image


def resize_image(image_path, resize=False):
    img = cv2.imread(image_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = img / 255
    if resize:
        img = cv2.resize(img, (224, 224))
    return img


def read_pdf(image_path):
    req = urllib.request.urlopen(image_path)
    # req = urllib.request.urlopen(image_path)
    arr = np.asarray(bytearray(req.read()), dtype=np.uint8)
    img = cv2.imdecode(arr, -1)

    # cv2_imshow(img)

    extractedInformation = pytesseract.image_to_string(img, lang='eng')

    return extractedInformation


def read_pdf_local(image_path):
    img_cv = cv2.imread(image_path)
    extractedInformation = pytesseract.image_to_string(img_cv, lang='eng')

    return extractedInformation


def remove_special_char(sentence):
    r = r'[' + string.punctuation + ']'
    sentence = " ".join(sentence.split('\n'))
    sentence = " ".join(sentence.split('"'))
    sentence = " ".join(sentence.split('�'))
    sentence = " ".join(sentence.split('�'))
    sentence = " ".join(sentence.split('�'))
    sentence = " ".join(sentence.split('�'))
    sentence = sentence.lower()
    return re.sub(r, '', sentence)

# dictionnaire capgemini pour zoi


interest_zone_ref_dict = {
    "depth": {
        1: ["depth", "mbrt", "md", "mrkb", "tvd", "tvdss"],
        2: ["depth mrkb", "depth mbrt", "measured depth", "depth m", "tvd m", "tvdss m", "tvd ft", "tvdss ft", "true vertical", "t vert", "true vert", "vert depth", "vertical depth", "tvd subsea"],
        3: ["measured depth mrkb", "measured depth mbrt", "true vertical depth", "t vert depth", "vertical depth m", "vert depth m", "vertical depth ft", "vert depth ft", "vertical depth subsea"],
        4: ["true vertical depth subsea", "true vertical depth m", "true vertical depth ft", "vertical depth sub sea", "vertical depth subsea m", "vertical depth subsea ft"],
        5: ["true vertical depth subsea m", "true vertical depth subsea ft"]
    },
    "pressure": {
        1: ["absolute", "fp_absolute", "psia", "fpa", "fpapsi", "pfa", "quartz", "fpapsi", "pretest", "strained", "fp", "pf", "fppsi", "pfpsi", "str"],
        2: ["absolute fp", "absolute formation", "absolute pressure", "pressure psia", "fp psia", "fp absolute", "fp abs", "pf psia", "pf abs", "pf absolute", "pretest pressure", "temp corr", "formation pressure", "corr formation", "corrected formation", "corr pressure", "corrected pressure", "form pressure", "form press", "str pressure", "f p"],
        3: ["absolute formation pressure", "absolute fp psi", "absolute fp psia", "temp corr formation", "corr formation pressure", "corrected formation pressure", "temperature corrected formation", "formation pressure psig"],
        4: ["absolute formation pressure psi", "absolute formation pressure psia", "temp corr formation pressure", "temperature corrected formation pressure", "corrected formation pressure psig", "corr formation pressure psig"],
        5: ["temp corr formation pressure psig", "temperature corrected formation pressure psig"]
    },
    "test": {
        1: ["rft", "fmt", "temp corrected"],
        2: ["temp corrected", "formation tester"],
        3: ["temp corrected results"]
    },
    "quality_test": {
        1: ["permeability", "perm", "quality", "comments", "comm", "remarks", "notes"],
        2: ["quality test", "permeability test", "test quality"]
    },
    "mobility": {
        1: ["md/cp", "mobility", "mob", "mdcp-1"],
        2: ["mobility md/cp", "permeability md/cp", "perm md/cp", "perm mdcp-1", "mob md/cp", "mobility mdcp-1, mob mdcp-1"]
    }
}


# fonction pour obtenir un array avec ttes les carect de l'image
def checker_dict(mot):
    dict1 = []
    dict3 = []
    remot = []
    for i in interest_zone_ref_dict.keys():
        dict1.append(i)

    for e in dict1:
        dict2 = interest_zone_ref_dict[e]
        long = len(dict2)

        j = 1
        while j <= long:
            for f in dict2[j]:
                if mot == f:
                    return e
            j += 1

    return mot


def myloop(l):
    newl = []
    for i in range(0, len(l)):
        newl.append(checker_dict(l[i]))

    return newl


def stats(ll):
    dp = 0
    prs = 0
    tst = 0
    qutst = 0
    mob = 0

    nbr = len(ll)+1

    for e in ll:
        if e == "depth":
            dp += 1

        if e == "pressure":
            prs += 1

        if e == "test":
            tst += 1

        if e == "quality_test":
            qutst += 1

        if e == " mobility":
            mob += 1

        if e.isdigit() == True:
            nbr = nbr - 1

    return [nbr, dp, prs, tst, qutst, mob]


term_page = remove_special_char(read_pdf(src_path))
# print(term_page)


def mon_traite(lll):
    # print(lll)
    term_list1 = lll.split()
    term_list2 = myloop(term_list1)
    return stats(term_list2)


# print(mon_traite(term_page))
# print(term_page)
mon_input = mon_traite(term_page)


# print(mon_input)


Pkl_Filename = "./model/XG-boost-Model.pkl"

with open(Pkl_Filename, 'rb') as file:
    classifier = pickle.load(file)

np.array(mon_input)

mon_input2 = [mon_input]
# print(mon_input)

# print(mon_input.shape)

mon_input3 = pd.DataFrame(mon_input2, columns=['0', '1', '2', '3', '4', '5'])

y_pred = classifier.predict(mon_input3)
y_pred

# print(y_pred[0])


def is_zoi(resultat):
    if resultat[0] == 1:
        return True
    else:
        return False


final_pred = is_zoi(y_pred)

print('True')
sys.stdout.flush()
