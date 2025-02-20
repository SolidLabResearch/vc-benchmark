import pandas as pd
def inplace_extract_implementation_from_implementation_class(e: pd.DataFrame):
    e['implementation'] = e.implementationClass.str.split('_').apply(lambda x: x[-1])
    
def inplace_extract_step_from_name_col(e: pd.DataFrame,inplace=True):
    e['step'] = e['name'].apply(lambda x: '_'.join(x.split('_')[1:]))

def inplace_extract_stepType_from_name_col(e: pd.DataFrame):
    e['stepType'] = e['name'].apply(lambda x: x.split('_')[0])

def compute_delta(df: pd.DataFrame) -> pd.Series:
    delta = df.end - df.start
    delta = delta.rename('delta')
    return delta