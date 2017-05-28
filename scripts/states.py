
# coding: utf-8

# In[1]:

import os,sys
import json
from PIL import Image
import random
import numpy as np
import math


# In[10]:

def dist(x,y):
    return (x[0]-y[0])**2 + (x[1]-y[1])**2 + (x[2]-y[2])**2
def eucdist(x,y):
    return (x[0]-y[0])**2 + (x[1]-y[1])**2

def makeAndSaveImage(data):
    a_range = [(i,10,0) for i in range(130,250)]
    d_range = [(10,i,40) for i in range(130,250)]
    f_range = [(170-i,140-i,220) for i in range(0,70)]
    j_range = [(255,i,0) for i in range(180,255)]
    s_range = [(0,i,255) for i in range(10,150)]
    ranges = {'a': a_range,
              'd': d_range,
              'f': f_range,
              'j': j_range,
              's': s_range}


    def rchoice_helper(x):
        return random.choice(ranges[x])

    rchoice = np.vectorize(rchoice_helper)

    total_px_num = data['size'][0] * data['size'][1]
    total_weight = data['data']['a']+data['data']['d']+data['data']['f']+data['data']['j']+data['data']['s']
    probs = [data['data']['a']/total_weight,
             data['data']['d']/total_weight,
             data['data']['f']/total_weight,
             data['data']['j']/total_weight,
             data['data']['s']/total_weight]
    impxls = list(map(rchoice_helper,list(np.random.choice(['a','d','f','j','s'],total_px_num,p=probs))))

    initialPoint = (random.choice(range(data['size'][0])),random.choice(range(data['size'][1])))
    basepoint = impxls[0]
    imsize = tuple(data['size'])
    unusedpixels = [(i,j) for i,j in np.ndindex(imsize)]
    newim = Image.new(size=imsize,mode='RGB')
    loaded = newim.load()
    unusedpixels = sorted(unusedpixels,key=(lambda x : eucdist(initialPoint,x)))
    newpxls = []
    newpxls += [(initialPoint,impxls[0])]
    unusedpixels.remove(initialPoint)
    loaded[initialPoint[0],initialPoint[1]] = impxls[0]

    nbhddelta = 5
    numtocheck = 100
    i = 0
    l = len(impxls)
    for p in impxls[1:]:
        i += 1
        if i%100 == 0:
            print('\r',float(100*float(i)/l),end='\r')
        closestPoint = min(newpxls[-numtocheck:],key=(lambda x : dist(x[1],p)))
        nbhdsize = 0
        nbhd = []
        while not nbhd:
            nbhdsize += nbhddelta
            nbhd = [(i-nbhdsize+closestPoint[0][0],j-nbhdsize+closestPoint[0][1]) 
                        for (i,j) in np.ndindex((nbhdsize*2,nbhdsize*2))
                                if i-nbhdsize+closestPoint[0][0] >= 0
                                        and j-nbhdsize+closestPoint[0][1] >= 0
                                        and i-nbhdsize+closestPoint[0][0] < imsize[0]
                                        and j-nbhdsize+closestPoint[0][1] < imsize[1]
                                        and loaded[i-nbhdsize+closestPoint[0][0],j-nbhdsize+closestPoint[0][1]] == (0,0,0)]
            nbhdsize *= nbhddelta
        closestFree = min(nbhd,key=(lambda x : eucdist(x,closestPoint[0])))
        newpxls += [(closestFree,p)]
        #unusedpixels.remove(closestFree)
        loaded[closestFree[0],closestFree[1]] = p

    newim.save('images/'+data['name']+'.jpg')


# In[11]:

# data = {
#     'name' : 'CO',
#     'size' : (145, 114),
#     'data' : {
#         'a': 0.035,
#         'd': 0.0,
#         'f': 0.02,
#         'j': 0.85,
#         's': 0.01
#     }
# }

makeAndSaveImage(json.loads(sys.argv[1]))


# In[ ]:



